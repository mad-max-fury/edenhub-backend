import { sendMail } from './';

export const sendWelcomeEmail = async (to: string, name: string) => {
  const context = {
    title: 'Welcome Email', // Data for the layout
    header: 'Welcome to Our Service', // Data for the layout
    name, // Data for the template
  };

  await sendMail(
    to,
    'Welcome to Our Service',
    'welcome', // Template name
    context // Context for both layout and template
  );
};

