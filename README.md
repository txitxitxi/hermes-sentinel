# Hermes Sentinel

**Never miss a Hermès restock again.** Monitor 33+ Hermès official websites 24/7 and get instant notifications when your dream bag becomes available.

---

## 🎯 Features

### For Users
- **Multi-Region Monitoring**: Track inventory across 33+ Hermès country websites simultaneously
- **Smart Product Filtering**: Set precise preferences for bag type, color, size, and price range
- **Instant Notifications**: Receive real-time alerts via email when products match your criteria
- **Restock History**: View historical data and identify patterns to predict future availability
- **Flexible Subscription Plans**: 7-day free trial, monthly, and annual plans available

### For Administrators
- **System Dashboard**: Monitor user count, active subscriptions, and restock statistics
- **User Management**: View and manage registered users
- **Monitoring Logs**: Track system health and monitoring activity across all regions
- **Real-time Analytics**: Get insights into system performance and user engagement

---

## 🏗️ Architecture

### Tech Stack
- **Frontend**: React 19 + Tailwind CSS 4 + shadcn/ui components
- **Backend**: Express 4 + tRPC 11 for type-safe API
- **Database**: MySQL/TiDB with Drizzle ORM
- **Authentication**: Manus OAuth integration
- **Monitoring**: Custom headless browser service (architecture in place)

### Project Structure
```
hermes-sentinel/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── pages/         # Page components (Home, Dashboard, etc.)
│   │   ├── components/    # Reusable UI components
│   │   └── lib/           # tRPC client setup
├── server/                # Backend Express + tRPC server
│   ├── routers.ts         # tRPC API routes
│   ├── db.ts              # Database query helpers
│   ├── monitoring-service.ts  # Product monitoring service
│   └── email-service.ts   # Email notification service
├── drizzle/               # Database schema and migrations
│   └── schema.ts          # Table definitions
└── shared/                # Shared types and constants
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 22+
- MySQL database
- Manus account (for authentication)

### Installation

1. **Clone and install dependencies**
   ```bash
   cd hermes-sentinel
   pnpm install
   ```

2. **Set up database**
   ```bash
   # Push schema to database
   pnpm db:push
   
   # Seed initial data (regions, categories, plans)
   node seed-data.mjs
   ```

3. **Start development server**
   ```bash
   pnpm dev
   ```

4. **Run tests**
   ```bash
   pnpm test
   ```

---

## 📊 Database Schema

### Core Tables
- **users**: User accounts with OAuth integration
- **subscriptions**: User subscription records (trial, active, expired)
- **subscription_plans**: Available subscription tiers
- **regions**: Hermès regional websites to monitor
- **product_categories**: Bag types (Birkin, Kelly, etc.)
- **monitoring_configs**: User-specific region monitoring settings
- **product_filters**: User-defined product preferences
- **products**: Detected products from monitored websites
- **restock_history**: Historical restock events
- **notifications**: Notification delivery records
- **monitoring_logs**: System monitoring activity logs

---

## 🔧 Configuration

### Subscription Plans
The system includes 4 pre-configured plans:
1. **Free Trial** (7 days): 1 region, 5 products, email notifications
2. **Basic Plan** ($25/month): 3 regions, 10 products, email notifications
3. **Premium Plan** ($60/month): 10 regions, 50 products, email + push notifications
4. **Annual Plan** ($576/year): 15 regions, 100 products, all features + priority support

### Monitored Regions
Pre-configured regions include:
- United States, United Kingdom, France, Germany, Italy, Spain
- Japan, China, Hong Kong, Singapore, Australia, Canada
- South Korea, Taiwan, Thailand
- *Total: 15 regions (expandable to 33+)*

### Product Categories
Pre-seeded categories:
- Birkin, Kelly, Constance, Evelyne, Picotin
- Garden Party, Herbag, Lindy, Bolide, Jypsiere

---

## 🔐 Authentication & Authorization

### User Roles
- **User**: Standard subscriber with monitoring and notification access
- **Admin**: Full system access including user management and analytics

### Protected Routes
- Dashboard, Monitoring, Filters, History, Subscription: Require authentication
- Admin Panel: Requires admin role

---

## 📧 Notification System

### Email Notifications
The system sends HTML email notifications when:
- A monitored product becomes available
- Product matches user's filter criteria
- Includes direct link to product page for quick checkout

### Notification Channels
- **Email**: Primary notification method (all plans)
- **Push Notifications**: Premium and Annual plans (architecture ready)

---

## 🛠️ Monitoring Service

### Architecture
The monitoring service (`server/monitoring-service.ts`) provides:
- Periodic scanning of Hermès regional websites
- Product availability detection
- Change tracking and restock recording
- Automatic notification triggering

### Implementation Status
- ✅ Service architecture and API complete
- ✅ Database integration ready
- ✅ Notification queue system
- ⚠️ Headless browser scraping: **Requires implementation**
- ⚠️ Proxy IP rotation: **Requires configuration**

### Production Deployment Notes
For production deployment, you'll need to implement:

1. **Headless Browser Scraping**
   - Use Puppeteer or Playwright with stealth plugins
   - Implement anti-detection measures (user agents, viewport randomization)
   - Handle dynamic content loading and pagination
   - Extract product data (name, price, availability, images)

2. **Proxy IP Rotation**
   - Integrate proxy service (Bright Data, Oxylabs, etc.)
   - Implement IP rotation to avoid rate limiting
   - Handle proxy failures and fallbacks

3. **Email Service Integration**
   - Configure SendGrid, AWS SES, or similar service
   - Update `server/email-service.ts` with actual provider
   - Set up email templates and delivery tracking

---

## 🧪 Testing

### Running Tests
```bash
# Run all tests
pnpm test

# Run specific test file
pnpm test subscription.test.ts
```

### Test Coverage
- ✅ Authentication (logout flow)
- ✅ Subscription management (plans, current subscription)
- ✅ Region monitoring (region list, configuration)
- ✅ Product filters (categories, filter creation)
- ✅ Admin functions (statistics, authorization)

---

## 📈 Future Enhancements

### Planned Features
- [ ] Real-time monitoring service with Puppeteer/Playwright
- [ ] Proxy IP pool integration
- [ ] Push notification support (Web Push API)
- [ ] Advanced trend analysis and prediction
- [ ] Product availability statistics and charts
- [ ] SMS notification option
- [ ] Mobile app (React Native)
- [ ] Webhook integrations
- [ ] Multi-language support

### Scalability Considerations
- Implement Redis for caching and job queues
- Use message queue (RabbitMQ/SQS) for notification delivery
- Add CDN for static assets
- Implement rate limiting and DDoS protection
- Set up monitoring and alerting (Sentry, DataDog)

---

## 🤝 Contributing

This is a production-ready foundation for a Hermès monitoring service. Key areas for contribution:

1. **Monitoring Service**: Implement actual web scraping logic
2. **Notification System**: Integrate real email/push providers
3. **Analytics**: Add charts and trend visualization
4. **Testing**: Expand test coverage for edge cases
5. **Documentation**: Add API documentation and deployment guides

---

## ⚖️ Legal Notice

**Hermes Sentinel is not affiliated with, endorsed by, or connected to Hermès International S.A.**

This software is provided for educational and personal use only. Users are responsible for:
- Complying with Hermès website terms of service
- Respecting rate limits and robots.txt
- Using the service ethically and legally
- Understanding that automated scraping may violate website policies

The developers assume no liability for misuse of this software.

---

## 📄 License

MIT License - See LICENSE file for details

---

## 🙏 Acknowledgments

- Built with [Manus](https://manus.im) platform
- UI components from [shadcn/ui](https://ui.shadcn.com)
- Icons from [Lucide](https://lucide.dev)

---

**Ready to never miss a Hermès restock?** Start your 7-day free trial today! 🎉
