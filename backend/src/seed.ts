import prisma from './config/database.js';
import bcrypt from 'bcryptjs';

async function main() {
  console.log('🌱 Starting database seed...');

  // Create admin user
  const adminPassword = await bcrypt.hash('admin', 10);
  
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buzzinga.com' },
    update: {},
    create: {
      email: 'admin@buzzinga.com',
      password: adminPassword,
      name: 'Admin User',
      role: 'ADMIN',
    },
  });

  console.log('✅ Created admin user:', admin.email);

  // Create sample page
  const samplePage = await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      title: 'Home Page',
      slug: 'home',
      content: {
        blocks: [
          {
            type: 'heading',
            data: { text: 'Welcome to Buzzinga CMS', level: 1 },
          },
          {
            type: 'paragraph',
            data: { text: 'This is a sample home page created during database seeding.' },
          },
        ],
      },
      status: 'PUBLISHED',
      description: 'Welcome to Buzzinga CMS',
      keywords: ['home', 'welcome'],
      authorId: admin.id,
    },
  });

  console.log('✅ Created sample page:', samplePage.slug);

  // Create sample collection
  const blogCollection = await prisma.collection.upsert({
    where: { slug: 'blog' },
    update: {},
    create: {
      name: 'Blog Posts',
      slug: 'blog',
      description: 'Blog post collection',
      fields: {
        title: { type: 'text', required: true },
        content: { type: 'richtext', required: true },
        excerpt: { type: 'textarea', required: false },
        featuredImage: { type: 'media', required: false },
        publishedAt: { type: 'date', required: false },
      },
      authorId: admin.id,
    },
  });

  console.log('✅ Created sample collection:', blogCollection.name);

  // Create sample menu
  const mainMenu = await prisma.menu.upsert({
    where: { slug: 'main-menu' },
    update: {},
    create: {
      name: 'Main Menu',
      slug: 'main-menu',
      location: 'header',
      items: [
        { id: '1', label: 'Home', url: '/', children: [] },
        { id: '2', label: 'Blog', url: '/blog', children: [] },
        { id: '3', label: 'About', url: '/about', children: [] },
        { id: '4', label: 'Contact', url: '/contact', children: [] },
      ],
      authorId: admin.id,
    },
  });

  console.log('✅ Created sample menu:', mainMenu.name);

  // Create sample form
  const contactForm = await prisma.form.upsert({
    where: { slug: 'contact-form' },
    update: {},
    create: {
      name: 'Contact Form',
      slug: 'contact-form',
      description: 'General contact form',
      fields: [
        {
          id: 'name',
          type: 'text',
          label: 'Name',
          required: true,
          placeholder: 'Your name',
        },
        {
          id: 'email',
          type: 'email',
          label: 'Email',
          required: true,
          placeholder: 'your@email.com',
        },
        {
          id: 'message',
          type: 'textarea',
          label: 'Message',
          required: true,
          placeholder: 'Your message',
          rows: 5,
        },
      ],
      settings: {
        submitButtonText: 'Send Message',
        successMessage: 'Thank you for your message!',
        emailNotification: true,
      },
      authorId: admin.id,
    },
  });

  console.log('✅ Created sample form:', contactForm.name);

  console.log('\n🎉 Database seeding completed!');
  console.log('\n📧 Login credentials:');
  console.log('   Email: admin@buzzinga.com');
  console.log('   Password: admin');
  console.log('\n⚠️  Please change the admin password after first login!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });


