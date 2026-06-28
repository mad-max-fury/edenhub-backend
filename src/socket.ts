import { Server as HttpServer } from "http";
import { Server, Socket } from "socket.io";
import jwt from "jsonwebtoken";
import { getConfig } from "./config";
import { findOneUser } from "./services/user.service";
import UserModel from "./models/user.model";
import * as conversationService from "./services/conversation.service";
import { MessageSender } from "./models/conversation.model";
import log from "./utils/logger";

let io: Server;
const onlineCustomers = new Map<string, string>();

export const getIO = () => io;
export const getOnlineCustomers = () => onlineCustomers;

export const initSocket = (httpServer: HttpServer, allowedOrigins: string[]) => {
  io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) return next(new Error("Authentication required"));

      const secret = getConfig("jwtSecret");
      const decoded = jwt.verify(token, secret) as { id: string };
      const user = await findOneUser({ _id: decoded.id });
      if (!user) return next(new Error("User not found"));

      socket.data.userId = decoded.id;
      const populated = await UserModel.findById(decoded.id).populate("role", "name");
      const roleName = (populated?.role as any)?.name?.toLowerCase() || "";
      const isStaff = !!(user.staffId?.trim()) || roleName.includes("admin") || roleName.includes("super");
      socket.data.role = isStaff ? "admin" : "customer";
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket: Socket) => {
    const userId = socket.data.userId;
    const role = socket.data.role;

    socket.join(`user:${userId}`);
    log.info(`Socket connected: ${userId} (${role})`);

    if (role === "customer") {
      onlineCustomers.set(userId, socket.id);
      io.emit("online_users_update", Array.from(onlineCustomers.keys()));
    }

    socket.on("get_online_users", () => {
      socket.emit("online_users_update", Array.from(onlineCustomers.keys()));
    });

    socket.on("join_conversation", (conversationId: string) => {
      socket.join(`conv:${conversationId}`);
    });

    socket.on("leave_conversation", (conversationId: string) => {
      socket.leave(`conv:${conversationId}`);
    });

    socket.on("send_message", async (data: { conversationId: string; body: string; attachments?: { url: string; type: string; name?: string }[] }) => {
      try {
        const sender =
          role === "admin" ? MessageSender.Admin : MessageSender.Customer;

        const conversation = await conversationService.addMessage(
          data.conversationId,
          sender,
          userId,
          data.body,
          data.attachments ?? [],
        );

        if (!conversation) return;

        const newMsg = conversation.messages[conversation.messages.length - 1];

        io.to(`conv:${data.conversationId}`).emit("new_message", {
          conversationId: data.conversationId,
          message: newMsg,
        });

        io.to(`conv:${data.conversationId}`).emit("conversation_updated", {
          conversationId: data.conversationId,
          lastMessageAt: conversation.lastMessageAt,
          lastMessagePreview: conversation.lastMessagePreview,
        });

        const customerId = String(
          (conversation.customer as any)._id ?? conversation.customer,
        );
        if (sender === MessageSender.Admin) {
          io.to(`user:${customerId}`).emit("unread_update");
        } else {
          io.emit("admin_unread_update");
        }
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    socket.on("typing", async (data: { conversationId: string }) => {
      let name = "";
      try {
        const u = await findOneUser({ _id: userId });
        if (u) name = `${u.firstName} ${u.lastName}`.trim();
      } catch {}
      socket.to(`conv:${data.conversationId}`).emit("user_typing", {
        conversationId: data.conversationId,
        userId,
        role,
        name,
      });
    });

    socket.on("stop_typing", (data: { conversationId: string }) => {
      socket.to(`conv:${data.conversationId}`).emit("user_stop_typing", {
        conversationId: data.conversationId,
        userId,
      });
    });

    socket.on("mark_read", async (data: { conversationId: string }) => {
      const readerRole =
        role === "admin" ? MessageSender.Admin : MessageSender.Customer;
      await conversationService.markMessagesRead(data.conversationId, readerRole);
      socket.to(`conv:${data.conversationId}`).emit("messages_read", {
        conversationId: data.conversationId,
        reader: role,
      });
    });

    socket.on("disconnect", () => {
      if (role === "customer") {
        onlineCustomers.delete(userId);
        io.emit("online_users_update", Array.from(onlineCustomers.keys()));
      }
      log.info(`Socket disconnected: ${userId}`);
    });
  });

  return io;
};
