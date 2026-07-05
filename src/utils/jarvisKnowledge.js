// ============================================================
// JARVIS Local Knowledge Engine — Zero API, Zero Key
// Comprehensive built-in knowledge base with smart pattern
// matching for general questions, business concepts,
// marketing strategy, tech, science, and more.
// ============================================================

// ─── Knowledge Base ───────────────────────────────────────
// Each entry: { keys: [...], answer: "..." }
// Keys are matched against the user's question with scoring

const KNOWLEDGE_BASE = [
  // ── Marketing & Business Strategy ──────────────────────
  {
    keys: ['rfm', 'rfm analysis', 'recency frequency monetary'],
    answer: `**RFM Analysis** stands for **Recency, Frequency, Monetary** — a customer segmentation technique.

• **Recency** — How recently a customer made a purchase
• **Frequency** — How often they purchase
• **Monetary** — How much they spend

Customers are scored on each dimension (typically 1-5), then grouped into segments like "Champions" (high R, F, M), "At Risk" (low R, high F/M), or "Lost" (low across all). It's the foundation of data-driven retention strategy.`
  },
  {
    keys: ['customer lifetime value', 'clv', 'cltv', 'ltv', 'lifetime value'],
    answer: `**Customer Lifetime Value (CLV)** is the total revenue a business can expect from a single customer over their entire relationship.

**Formula:** CLV = (Avg Purchase Value) × (Purchase Frequency) × (Customer Lifespan)

• A customer spending **$50/order**, buying **4x/year** for **3 years** = **$600 CLV**
• High CLV customers deserve premium treatment and retention investment
• Acquiring a new customer costs **5-7x more** than retaining an existing one`
  },
  {
    keys: ['churn', 'churn rate', 'customer churn', 'reduce churn', 'prevent churn', 'stop churn'],
    answer: `**Churn rate** is the percentage of customers who stop doing business with you over a given period.

**Formula:** Churn Rate = (Customers Lost ÷ Total Customers) × 100

**How to reduce churn:**
• Identify at-risk customers early using predictive scoring
• Personalize outreach before they leave
• Offer loyalty rewards for repeat purchases
• Fix pain points in the customer experience
• A **5% reduction in churn** can increase profits by **25-95%** (Harvard Business Review)`
  },
  {
    keys: ['retention', 'customer retention', 'retention rate', 'retain customers', 'keep customers'],
    answer: `**Customer Retention** is the ability to keep customers buying over time.

**Retention Rate Formula:** ((End Customers - New Customers) ÷ Start Customers) × 100

**Key strategies:**
• Loyalty programs with meaningful rewards
• Personalized communication based on purchase history
• Proactive customer service
• Exclusive early access for repeat buyers
• Post-purchase follow-ups

**Why it matters:** Increasing retention by **5%** boosts profits by **25-95%**. Retained customers spend **67% more** than new ones.`
  },
  {
    keys: ['segmentation', 'customer segmentation', 'segment customers', 'market segmentation'],
    answer: `**Customer Segmentation** divides your customer base into distinct groups based on shared characteristics.

**Common approaches:**
• **Demographic** — Age, gender, income, location
• **Behavioral** — Purchase frequency, spending, product preferences
• **Value-based** — Tier systems (Platinum/Gold/Silver/Bronze)
• **Psychographic** — Lifestyle, values, interests
• **RFM** — Recency, Frequency, Monetary scoring

Segmentation enables targeted marketing, personalized offers, and efficient resource allocation.`
  },
  {
    keys: ['cohort', 'cohort analysis'],
    answer: `**Cohort Analysis** groups customers by a shared characteristic (usually acquisition date) and tracks their behavior over time.

**Example:** Track all customers acquired in January and measure their repeat purchase rate each month vs. those acquired in February.

**Why it matters:**
• Reveals if retention is improving or declining over time
• Shows which acquisition channels produce loyal customers
• Helps identify when customers typically churn
• Measures the impact of product or strategy changes`
  },
  {
    keys: ['nps', 'net promoter score', 'promoter score'],
    answer: `**Net Promoter Score (NPS)** measures customer loyalty with one question: "How likely are you to recommend us?" (0-10 scale)

• **Promoters (9-10)** — Loyal enthusiasts
• **Passives (7-8)** — Satisfied but vulnerable
• **Detractors (0-6)** — Unhappy customers

**Formula:** NPS = % Promoters - % Detractors

**Benchmarks:** Above 0 = Good, Above 50 = Excellent, Above 70 = World-class`
  },
  {
    keys: ['cac', 'customer acquisition cost', 'acquisition cost', 'cost to acquire'],
    answer: `**Customer Acquisition Cost (CAC)** is the total cost of acquiring a new customer.

**Formula:** CAC = Total Marketing & Sales Spend ÷ Number of New Customers

**Healthy ratio:** CLV:CAC should be at least **3:1** — meaning each customer generates 3x what it cost to acquire them.

• If CAC > CLV, you're losing money on every customer
• Lower CAC through referrals, organic content, and retention-driven growth`
  },
  {
    keys: ['aov', 'average order value', 'average order', 'basket size'],
    answer: `**Average Order Value (AOV)** is the average amount spent per transaction.

**Formula:** AOV = Total Revenue ÷ Number of Orders

**How to increase AOV:**
• Product bundling and cross-sells
• Free shipping thresholds ("Spend $75 for free shipping")
• Tiered pricing incentives
• Upselling premium versions
• Limited-time add-on offers at checkout`
  },
  {
    keys: ['conversion', 'conversion rate', 'convert', 'conversion funnel'],
    answer: `**Conversion Rate** is the percentage of visitors who complete a desired action (purchase, signup, etc.).

**Formula:** Conversion Rate = (Conversions ÷ Total Visitors) × 100

**E-commerce benchmarks:** 2-3% average, 5%+ is strong

**How to improve:**
• Simplify checkout flow
• Add trust signals (reviews, guarantees)
• Optimize page load speed
• Use compelling CTAs
• A/B test landing pages`
  },
  {
    keys: ['a/b test', 'ab test', 'split test', 'a b testing'],
    answer: `**A/B Testing** compares two versions of something (page, email, ad) to see which performs better.

**How it works:**
1. Create two variants (A = control, B = variation)
2. Split traffic randomly between them
3. Measure a key metric (clicks, conversions, revenue)
4. The winner becomes the new default

**Rules:** Test one variable at a time, run until statistically significant, and use a minimum sample size of ~1,000 per variant.`
  },
  {
    keys: ['funnel', 'sales funnel', 'marketing funnel', 'purchase funnel'],
    answer: `**Sales/Marketing Funnel** represents the customer journey from awareness to purchase.

**Stages:**
1. **Awareness** — Customer discovers your brand
2. **Interest** — They explore products/content
3. **Consideration** — Comparing options, reading reviews
4. **Intent** — Adding to cart, requesting info
5. **Purchase** — Transaction completed
6. **Loyalty** — Repeat purchases, advocacy

Each stage narrows — optimizing conversion between stages is key to growth.`
  },
  {
    keys: ['kpi', 'key performance indicator', 'metrics', 'which metrics'],
    answer: `**Key Performance Indicators (KPIs)** for customer-centric businesses:

**Revenue:** AOV, Revenue per Customer, Total Revenue
**Acquisition:** CAC, Conversion Rate, Traffic Sources
**Retention:** Churn Rate, Retention Rate, CLV, Repeat Purchase Rate
**Engagement:** NPS, Review Rating, Email Open Rate
**Efficiency:** CLV:CAC Ratio, Payback Period, Margin per Customer`
  },
  {
    keys: ['promo dependency', 'discount dependency', 'promo trap', 'discount trap', 'too many discounts'],
    answer: `**Promo Dependency** occurs when customers are trained to only buy during discounts.

**Signs:**
• Customers wait for sales and ignore full-price
• Revenue spikes only during promotions
• Margins erode despite growing sales

**How to break free:**
• Gradually reduce discount frequency
• Replace discounts with value-adds (free shipping, exclusive access)
• Segment promo-dependent vs. full-price buyers
• Sunset discounts for customers who'd buy anyway`
  },
  {
    keys: ['email marketing', 'email strategy', 'email campaign', 'email tips'],
    answer: `**Email Marketing Best Practices:**

• **Subject lines** — Keep under 50 chars, create urgency or curiosity
• **Personalization** — Use name, past purchases, segment-specific content
• **Timing** — Tuesday-Thursday, 10am or 2pm typically perform best
• **Frequency** — 1-3x/week for most brands, test what works
• **Segmentation** — Never blast the same email to everyone
• **CTA** — One clear call-to-action per email
• **Benchmarks** — 20-25% open rate, 2-5% click rate is healthy`
  },
  {
    keys: ['loyalty program', 'rewards program', 'points program'],
    answer: `**Loyalty Program Best Practices:**

**Types:**
• **Points-based** — Earn points per dollar, redeem for rewards
• **Tiered** — Bronze/Silver/Gold/Platinum with increasing perks
• **Paid** — Premium membership (like Amazon Prime)
• **Cashback** — Percentage back on purchases

**What works:**
• Make rewards attainable (first reward within 2-3 purchases)
• Offer experiential rewards, not just discounts
• Tiered status creates aspiration
• Birthday/anniversary perks drive engagement`
  },
  // ── Data Science & Analytics ────────────────────────────
  {
    keys: ['machine learning', 'ml', 'what is machine learning'],
    answer: `**Machine Learning** is a branch of AI where systems learn patterns from data without being explicitly programmed.

**Types:**
• **Supervised** — Learns from labeled data (e.g., predict churn: yes/no)
• **Unsupervised** — Finds hidden patterns (e.g., customer clustering)
• **Reinforcement** — Learns through trial and reward (e.g., recommendation engines)

**In retail/CRM:** Used for churn prediction, recommendation engines, demand forecasting, customer segmentation, and dynamic pricing.`
  },
  {
    keys: ['artificial intelligence', 'ai', 'what is ai'],
    answer: `**Artificial Intelligence (AI)** is technology that enables machines to simulate human intelligence — learning, reasoning, problem-solving, and decision-making.

**Key branches:**
• **Machine Learning** — Learning from data patterns
• **NLP** — Understanding human language
• **Computer Vision** — Interpreting images/video
• **Generative AI** — Creating text, images, code

**In business:** Powering chatbots, personalization, fraud detection, demand forecasting, and automated customer service.`
  },
  {
    keys: ['data science', 'what is data science'],
    answer: `**Data Science** combines statistics, programming, and domain expertise to extract insights from data.

**Process:**
1. Define the business question
2. Collect and clean data
3. Explore and visualize patterns
4. Build predictive models
5. Communicate findings and deploy

**Tools:** Python, SQL, R, Pandas, Scikit-learn, TensorFlow, Tableau, Power BI`
  },
  {
    keys: ['regression', 'linear regression', 'logistic regression'],
    answer: `**Regression** is a statistical method to model relationships between variables.

• **Linear Regression** — Predicts a continuous value (e.g., expected spend)
  Formula: y = mx + b

• **Logistic Regression** — Predicts a probability/category (e.g., will they churn? yes/no)
  Output: probability between 0 and 1

Both are foundational ML algorithms used in customer analytics for predicting spend, churn risk, and lifetime value.`
  },
  {
    keys: ['clustering', 'k-means', 'kmeans', 'cluster analysis'],
    answer: `**Clustering** groups similar data points together without predefined labels.

**K-Means** is the most common algorithm:
1. Choose K (number of clusters)
2. Randomly place K centroids
3. Assign each point to nearest centroid
4. Recalculate centroids
5. Repeat until stable

**In retail:** Used to discover natural customer segments based on behavior — spending patterns, purchase frequency, product preferences.`
  },
  {
    keys: ['sql', 'what is sql', 'structured query language'],
    answer: `**SQL (Structured Query Language)** is the standard language for managing and querying relational databases.

**Core commands:**
• **SELECT** — Retrieve data
• **WHERE** — Filter rows
• **JOIN** — Combine tables
• **GROUP BY** — Aggregate data
• **ORDER BY** — Sort results
• **INSERT/UPDATE/DELETE** — Modify data

**Example:** \`SELECT value_tier, COUNT(*) FROM customers GROUP BY value_tier\` — counts customers per tier.`
  },
  {
    keys: ['python', 'what is python'],
    answer: `**Python** is a versatile programming language widely used in data science, AI, web development, and automation.

**Why it's popular:**
• Simple, readable syntax
• Massive ecosystem of libraries (Pandas, NumPy, Scikit-learn, TensorFlow)
• Great for data analysis, ML, and scripting
• Strong community and documentation

**In analytics:** Python + Pandas + SQL is the standard stack for customer data analysis, feature engineering, and predictive modeling.`
  },
  // ── General Business ───────────────────────────────────
  {
    keys: ['roi', 'return on investment'],
    answer: `**Return on Investment (ROI)** measures the profitability of an investment.

**Formula:** ROI = ((Gain - Cost) ÷ Cost) × 100

**Example:** Spent $1,000 on a campaign, generated $4,000 in revenue → ROI = **300%**

A positive ROI means the investment is profitable. In marketing, aim for at least **3:1** return (300% ROI).`
  },
  {
    keys: ['swot', 'swot analysis'],
    answer: `**SWOT Analysis** is a strategic framework:

• **S — Strengths** — Internal advantages (brand, data, product quality)
• **W — Weaknesses** — Internal limitations (high CAC, low retention)
• **O — Opportunities** — External potential (new markets, trends)
• **T — Threats** — External risks (competition, economic downturn)

Used to evaluate strategic position before making business decisions.`
  },
  {
    keys: ['b2b', 'business to business'],
    answer: `**B2B (Business-to-Business)** refers to transactions between businesses rather than between a business and individual consumers (B2C).

**Key differences from B2C:**
• Longer sales cycles
• Higher order values
• Multiple decision-makers
• Relationship-driven selling
• Rational purchasing decisions over emotional ones`
  },
  {
    keys: ['b2c', 'business to consumer'],
    answer: `**B2C (Business-to-Consumer)** refers to businesses selling directly to individual consumers.

**Characteristics:**
• Shorter sales cycles
• Emotional purchase drivers
• Higher volume, lower per-unit value
• Brand and experience matter heavily
• Marketing through social media, email, ads`
  },
  {
    keys: ['market research', 'market analysis'],
    answer: `**Market Research** is the process of gathering information about customers, competitors, and market conditions.

**Methods:**
• **Surveys** — Direct customer feedback
• **Interviews** — In-depth qualitative insights
• **Analytics** — Behavioral data from purchases/website
• **Competitor analysis** — Benchmarking against rivals
• **Focus groups** — Group discussions for product feedback

Data-driven decisions outperform gut instinct by a significant margin.`
  },
  {
    keys: ['brand', 'branding', 'brand strategy', 'brand identity'],
    answer: `**Branding** is how customers perceive and experience your business.

**Core elements:**
• **Brand Identity** — Logo, colors, typography, visual style
• **Brand Voice** — How you communicate (formal, friendly, luxury)
• **Brand Values** — What you stand for
• **Brand Promise** — The consistent experience you deliver
• **Brand Equity** — The value your brand adds beyond the product

Strong brands command premium pricing and higher customer loyalty.`
  },
  {
    keys: ['pricing strategy', 'pricing', 'how to price', 'price optimization'],
    answer: `**Pricing Strategies:**

• **Cost-plus** — Cost + fixed markup percentage
• **Value-based** — Price based on perceived customer value
• **Competitive** — Match or undercut competitors
• **Premium** — High price signals exclusivity/quality
• **Penetration** — Low launch price to gain market share
• **Dynamic** — Price adjusts based on demand/time

**For luxury brands:** Value-based and premium pricing protect brand perception. Discounting erodes perceived value.`
  },
  // ── Technology ─────────────────────────────────────────
  {
    keys: ['api', 'what is an api', 'application programming interface'],
    answer: `**API (Application Programming Interface)** is a set of rules that allows software systems to communicate with each other.

**Analogy:** A restaurant menu — you (the app) pick from a menu (API), the kitchen (server) prepares it, and the waiter (API) delivers the result.

**Types:** REST API, GraphQL, WebSocket
**Used for:** Fetching data, integrating services, automating workflows.`
  },
  {
    keys: ['cloud', 'cloud computing', 'aws', 'azure', 'gcp'],
    answer: `**Cloud Computing** delivers computing resources (servers, storage, databases) over the internet on-demand.

**Major providers:**
• **AWS** (Amazon) — Largest market share
• **Azure** (Microsoft) — Strong enterprise integration
• **GCP** (Google) — Leading in AI/ML tools

**Models:**
• **IaaS** — Infrastructure (virtual machines)
• **PaaS** — Platform (managed databases, app hosting)
• **SaaS** — Software (Gmail, Salesforce, Shopify)`
  },
  {
    keys: ['react', 'reactjs', 'react.js'],
    answer: `**React** is a JavaScript library for building user interfaces, created by Meta (Facebook).

**Key concepts:**
• **Components** — Reusable UI building blocks
• **JSX** — HTML-like syntax in JavaScript
• **State** — Data that drives UI updates
• **Props** — Data passed between components
• **Hooks** — Functions like useState, useEffect for managing logic

This application is built with React.`
  },
  {
    keys: ['javascript', 'js', 'what is javascript'],
    answer: `**JavaScript** is the programming language of the web — it runs in every browser and powers interactive web experiences.

**Used for:**
• Frontend UI (React, Vue, Angular)
• Backend servers (Node.js)
• Mobile apps (React Native)
• Data visualization (D3.js, Recharts)

**Key features:** Dynamic typing, event-driven, asynchronous (Promises/async-await), massive ecosystem via npm.`
  },
  {
    keys: ['database', 'what is a database', 'relational database', 'nosql'],
    answer: `**Database** is an organized collection of structured data.

**Types:**
• **Relational (SQL)** — Tables with rows/columns (PostgreSQL, MySQL) — great for structured data
• **NoSQL** — Flexible schemas (MongoDB, Redis) — great for unstructured/fast-changing data
• **Data Warehouse** — Optimized for analytics (BigQuery, Snowflake, Redshift)

**For customer analytics:** Relational databases are the standard for structured customer data with SQL querying.`
  },
  // ── Science & General Knowledge ────────────────────────
  {
    keys: ['blockchain', 'what is blockchain', 'crypto', 'cryptocurrency'],
    answer: `**Blockchain** is a decentralized, distributed ledger that records transactions across many computers.

**Key properties:**
• **Immutable** — Records can't be altered
• **Decentralized** — No single point of control
• **Transparent** — All participants can verify

**Cryptocurrency** (Bitcoin, Ethereum) uses blockchain for digital currency. Beyond crypto, blockchain is used in supply chain tracking, digital identity, and smart contracts.`
  },
  {
    keys: ['big data', 'what is big data'],
    answer: `**Big Data** refers to datasets too large or complex for traditional tools to handle.

**The 5 V's:**
• **Volume** — Massive amounts of data
• **Velocity** — Data generated at high speed
• **Variety** — Structured, unstructured, semi-structured
• **Veracity** — Data quality and accuracy
• **Value** — Actionable insights extracted

**Tools:** Hadoop, Spark, BigQuery, Snowflake, Kafka`
  },
  {
    keys: ['neural network', 'deep learning', 'what is deep learning'],
    answer: `**Deep Learning** is a subset of machine learning using multi-layered neural networks.

**How it works:**
• Input data passes through layers of "neurons"
• Each layer extracts increasingly complex features
• Output layer makes a prediction

**Applications:** Image recognition, language translation, speech-to-text, recommendation systems, autonomous driving.

**Popular frameworks:** TensorFlow, PyTorch, Keras`
  },
  // ── Retail & E-commerce ────────────────────────────────
  {
    keys: ['omnichannel', 'omni-channel', 'multichannel'],
    answer: `**Omnichannel** is a customer experience strategy that provides seamless interaction across all channels — online, in-store, mobile, social media.

**vs. Multichannel:** Multichannel = multiple separate channels. Omnichannel = all channels connected and consistent.

**Key elements:**
• Unified customer profile across channels
• Consistent pricing and promotions
• Buy online, pick up in store (BOPIS)
• Shared cart and wishlist across devices`
  },
  {
    keys: ['personalization', 'personalize', 'personalized marketing'],
    answer: `**Personalization** tailors the customer experience based on individual data and behavior.

**Levels:**
1. **Basic** — Name in emails
2. **Segmented** — Content by customer group
3. **Behavioral** — Based on browsing/purchase history
4. **Predictive** — AI-driven next-best-action

**Impact:** Personalized experiences drive **40% more revenue** than generic ones (McKinsey). 80% of consumers are more likely to buy from brands that personalize.`
  },
  {
    keys: ['supply chain', 'supply chain management', 'logistics'],
    answer: `**Supply Chain Management** oversees the flow of goods from raw materials to the customer.

**Key stages:**
1. **Sourcing** — Raw materials and suppliers
2. **Manufacturing** — Production
3. **Warehousing** — Storage and inventory management
4. **Distribution** — Shipping and logistics
5. **Last mile** — Final delivery to customer

**Optimization:** Just-in-time inventory, demand forecasting, route optimization, and supplier diversification.`
  },
  {
    keys: ['crm', 'customer relationship management'],
    answer: `**CRM (Customer Relationship Management)** is software that manages all customer interactions and data in one place.

**Popular CRMs:** Salesforce, HubSpot, Zoho, Pipedrive

**Core features:**
• Contact management
• Sales pipeline tracking
• Email campaign management
• Customer service ticketing
• Analytics and reporting

**Why it matters:** Companies using CRM see an average **29% increase in sales** and **42% improvement in forecast accuracy**.`
  },
  {
    keys: ['upsell', 'cross sell', 'upselling', 'cross-selling'],
    answer: `**Upselling** — Encouraging a higher-priced version of what they're buying.
Example: "Upgrade to the premium plan for $10 more."

**Cross-selling** — Suggesting complementary products.
Example: "Customers who bought this also bought..."

**Best practices:**
• Recommend relevant products (not random)
• Keep suggestions to 2-3 options
• Show social proof ("Bestseller", "Most popular")
• Time it right — during checkout or post-purchase`
  },
  // ── Finance Basics ─────────────────────────────────────
  {
    keys: ['profit margin', 'margin', 'gross margin', 'net margin'],
    answer: `**Profit Margin** measures how much profit you keep from revenue.

• **Gross Margin** = (Revenue - COGS) ÷ Revenue × 100
  → How much you keep after direct production costs

• **Net Margin** = Net Profit ÷ Revenue × 100
  → How much you keep after ALL expenses

**Benchmarks:** Luxury retail gross margins are typically **60-80%**, net margins **10-20%**.`
  },
  {
    keys: ['revenue', 'what is revenue', 'revenue vs profit'],
    answer: `**Revenue** is the total income from sales before any expenses are deducted. Also called "top line."

**Revenue ≠ Profit:**
• **Revenue** — Total sales ($100,000)
• **Gross Profit** — Revenue minus cost of goods ($60,000)
• **Net Profit** — Revenue minus ALL costs ($15,000) — the "bottom line"

A company can have high revenue but low or negative profit if costs are too high.`
  },
  {
    keys: ['break even', 'breakeven', 'break-even point'],
    answer: `**Break-Even Point** is when total revenue equals total costs — no profit, no loss.

**Formula:** Break-Even = Fixed Costs ÷ (Price per Unit - Variable Cost per Unit)

**Example:** Fixed costs = $10,000/month, product price = $50, variable cost = $20
Break-even = 10,000 ÷ 30 = **334 units/month**

Below 334 units = loss. Above 334 = profit.`
  },
  // ── Writing & Communication ────────────────────────────
  {
    keys: ['write email', 'retention email', 'marketing email', 'write a email', 'email template'],
    answer: `Here's a retention email template:

**Subject:** We miss you — here's something special

Hi [Name],

It's been a while since your last visit, and we wanted to check in.

As a valued customer, we'd love to welcome you back with **complimentary express shipping** on your next order — no code needed, it's already applied to your account.

Our new collection just dropped, and based on your taste, we think you'll love it.

**[Shop Now →]**

Warm regards,
The BrandIQ Team

*This offer is exclusive to you and expires in 7 days.*`
  },
  {
    keys: ['write strategy', 'strategy memo', 'write a memo', 'strategy plan', 'action plan'],
    answer: `**Strategy Memo Template:**

**TO:** Leadership Team
**RE:** Customer Retention — Priority Actions

**Situation:** Analysis of our customer base reveals key retention opportunities.

**Recommended Actions (Priority Order):**

1. **Stop discounting promo-trapped customers** — Replace discount codes with free shipping upgrades. Expected margin recovery within 60 days.

2. **Reactivate at-risk Platinum/Gold customers** — Personalized outreach with premium treatment (early access, exclusive previews). These are high-value customers worth saving.

3. **Double down on Ideal Customer acquisition** — Target lookalikes of high-value, non-promo-dependent customers in underserved states.

**Timeline:** Execute action 1 this week. Actions 2-3 within 30 days.
**Measurement:** Track repeat purchase rate, margin per customer, and churn rate monthly.`
  },
  {
    keys: ['elevator pitch', 'pitch', 'how to pitch'],
    answer: `**Elevator Pitch Formula** (30-60 seconds):

1. **Hook** — Start with a surprising fact or problem
2. **Problem** — What pain point you solve
3. **Solution** — What you do (one sentence)
4. **Proof** — A key metric or result
5. **Ask** — What you want from the listener

**Example:** "Did you know brands lose 40% of revenue to unnecessary discounting? BrandIQ identifies which customers will buy at full price, which need retention nudges, and which are margin-negative traps — all from existing purchase data. We've helped brands recover $200K+ in margin. Can I show you a 10-minute demo?"`
  },
  // ── Math & Statistics ──────────────────────────────────
  {
    keys: ['standard deviation', 'std dev', 'variance'],
    answer: `**Standard Deviation** measures how spread out values are from the average.

• **Low SD** = Data points cluster near the mean (consistent)
• **High SD** = Data points are spread out (variable)

**Formula:** SD = √(Σ(xi - mean)² / n)

**Example:** If avg customer spend is $50 with SD of $5, most spend between $45-$55. If SD is $25, spending ranges wildly from $25-$75+.`
  },
  {
    keys: ['correlation', 'correlation coefficient', 'r squared', 'r-squared'],
    answer: `**Correlation** measures the strength of a linear relationship between two variables.

• **+1** = Perfect positive correlation (as X rises, Y rises)
• **0** = No correlation
• **-1** = Perfect negative correlation (as X rises, Y falls)

**R-squared** = correlation squared — tells you what % of variation in Y is explained by X.
Example: R² = 0.85 means 85% of variation in spend is explained by loyalty score.

**Correlation ≠ Causation** — always remember this.`
  },
  {
    keys: ['p-value', 'p value', 'statistical significance', 'significance'],
    answer: `**P-value** tells you the probability that your result happened by chance.

• **p < 0.05** — Statistically significant (95% confidence)
• **p < 0.01** — Highly significant (99% confidence)
• **p > 0.05** — Not significant — could be random

**Example:** Testing if a new email subject line improves open rates. If p = 0.03, there's only a 3% chance the improvement was random — the new subject line likely works.`
  },
  {
    keys: ['mean median mode', 'mean', 'median', 'mode', 'average'],
    answer: `**Measures of Central Tendency:**

• **Mean** — Sum of all values ÷ count. Sensitive to outliers.
• **Median** — Middle value when sorted. Better for skewed data.
• **Mode** — Most frequently occurring value.

**When to use which:**
• **Mean** — Normally distributed data (e.g., avg review rating)
• **Median** — Skewed data with outliers (e.g., customer spend — a few big spenders skew the mean)
• **Mode** — Categorical data (e.g., most popular product category)`
  },
  // ── Miscellaneous ──────────────────────────────────────
  {
    keys: ['pareto', 'pareto principle', '80/20', '80 20 rule'],
    answer: `**Pareto Principle (80/20 Rule):** Roughly 80% of effects come from 20% of causes.

**In business:**
• 80% of revenue comes from 20% of customers
• 80% of complaints come from 20% of products
• 80% of sales come from 20% of your catalog

**Application:** Focus your retention and VIP efforts on the top 20% of customers. They disproportionately drive your business.`
  },
  {
    keys: ['agile', 'scrum', 'agile methodology'],
    answer: `**Agile** is an iterative approach to project management and development.

**Core principles:**
• Work in short cycles (sprints, typically 2 weeks)
• Deliver working increments frequently
• Adapt to change over following a rigid plan
• Collaboration over documentation

**Scrum** is the most popular Agile framework:
• **Sprint Planning** → **Daily Standups** → **Sprint Review** → **Retrospective** → Repeat`
  },
  {
    keys: ['design thinking', 'ux', 'user experience'],
    answer: `**Design Thinking** is a human-centered problem-solving approach:

1. **Empathize** — Understand user needs
2. **Define** — Frame the core problem
3. **Ideate** — Brainstorm solutions
4. **Prototype** — Build quick mockups
5. **Test** — Get user feedback, iterate

**UX (User Experience)** applies these principles to digital products — making them intuitive, accessible, and delightful to use.`
  },
  {
    keys: ['inflation', 'what is inflation'],
    answer: `**Inflation** is the rate at which prices for goods and services increase over time, reducing purchasing power.

• **Healthy inflation:** ~2% annually (target for most central banks)
• **High inflation:** Erodes consumer spending power, increases costs
• **Deflation:** Falling prices — can signal economic weakness

**Impact on retail:** Higher costs, squeezed margins, price-sensitive customers. Premium brands are more resilient to inflation than discount brands.`
  },
  {
    keys: ['gdp', 'gross domestic product'],
    answer: `**GDP (Gross Domestic Product)** is the total value of all goods and services produced in a country over a period.

**Formula:** GDP = Consumption + Investment + Government Spending + (Exports - Imports)

• **GDP growth** = economy is expanding
• **GDP decline** (2+ quarters) = recession

Used as the primary indicator of a country's economic health.`
  },
  {
    keys: ['recession', 'what is recession', 'economic downturn'],
    answer: `**Recession** is a significant decline in economic activity lasting more than a few months — technically defined as two consecutive quarters of GDP decline.

**Signs:** Rising unemployment, falling consumer spending, declining business investment, stock market drops.

**Impact on retail:** Consumers cut discretionary spending, trade down to cheaper alternatives, seek more discounts. Luxury brands with strong loyalty tend to be more resilient.`
  },
  {
    keys: ['who are you', 'what are you', 'introduce yourself', 'your name'],
    answer: `I'm **JARVIS** — Just A Rather Very Intelligent System.

I'm the built-in AI strategist for **BrandIQ**, your customer intelligence platform. I analyze your customer data in real-time and can answer questions about tiers, loyalty, churn, geography, promo dependency, revenue, demographics, and strategy.

I also have built-in knowledge covering marketing, analytics, business strategy, technology, data science, and more — all running locally with zero external API calls.`
  },
  {
    keys: ['thank', 'thanks', 'thank you', 'thx'],
    answer: `You're welcome. Ask me anything else — I'm here.`
  },
  {
    keys: ['bye', 'goodbye', 'see you', 'exit'],
    answer: `Goodbye. I'll be here whenever you need me — just click the J button.`
  },
  // ── Charts & Visualizations ─────────────────────────────
  {
    keys: ['ticket size chart', 'average ticket size', 'spend by category chart', 'spend by category graph', 'explain ticket size', 'explain category spend'],
    answer: `The **Average Ticket Size by Category** chart compares customer purchasing power across garment classifications (Clothing, Accessories, Footwear, Outerwear). 

• **Purpose:** Identifies which categories command the highest order values.
• **Strategic Action:** Typically, **Outerwear** has the highest average ticket size, making it a high-leverage category for upsell campaigns, whereas **Clothing** acts as the high-volume entry point.`
  },
  {
    keys: ['demand state chart', 'state distribution chart', 'state distribution graph', 'explain demand state', 'opportunity density chart'],
    answer: `The **Demand State Distribution** area chart maps profile counts and organic opportunity scores across top US states.

• **Purpose:** Highlights geographic regions with strong organic customer demand and low promo reliance.
• **Strategic Action:** States with high opportunity scores represent premium target regions for focused marketing expansion and localized campaigns without relying on discounts.`
  },
  {
    keys: ['value tier composition', 'value tier chart', 'value tier graph', 'pyramid distribution chart', 'pyramid distribution graph', 'explain pyramid chart'],
    answer: `The **Value Tier Composition** chart breaks down the customer base into Platinum, Gold, Silver, and Bronze segments based on composite value scoring.

• **Purpose:** Visualizes the size and distribution of each customer quality tier.
• **Strategic Action:** Platinum and Gold tiers represent your VIPs who generate the bulk of revenue. Target them with early previews and express shipping upgrades, rather than margin-eroding discounts.`
  },
  {
    keys: ['pyramid radar', 'tier metrics radar', 'tier radar chart', 'explain radar chart', 'explain radar graph'],
    answer: `The **Tier Metrics Radar** chart compares your customer tiers across 5 crucial axes: Spend, Frequency, Loyalty, Satisfaction, and Promo-Free behaviors.

• **Purpose:** Diagnoses the core behavioral strengths and weaknesses of each tier.
• **Strategic Action:** Look for gaps where a tier scores high on spend but low on loyalty, signaling the need for immediate engagement campaigns before they churn.`
  },
  {
    keys: ['promo scatter', 'promo dependency vs spend', 'promo dependency scatter', 'explain scatter chart', 'explain scatter graph'],
    answer: `The **Promo Dependency vs Spend** scatter plot maps individual customers by their discount reliance score against their total spend.

• **Purpose:** Identifies "Promo Trappers" (high discount reliance, low total spend) vs "Full-Price Champions" (low discount reliance, high spend).
• **Strategic Action:** Stop emailing discount codes to the promo-trapped cluster. Transition them to value-add incentives (like free shipping) to protect product margins.`
  },
  {
    keys: ['promo rate by tier', 'promo rate chart', 'promo rate graph', 'discount rate by tier'],
    answer: `The **Promo Rate by Tier** bar chart compares how frequently each value tier utilizes discount codes during transactions.

• **Purpose:** Measures the discount exposure of your most valuable customers.
• **Strategic Action:** A high discount rate in Platinum or Gold is problematic, as these shoppers would likely purchase at full price anyway. Phase out discounts for VIPs.`
  },
  {
    keys: ['recovery opportunity chart', 'playbook recovery chart', 'playbook chart', 'margin recovery graph', 'explain playbook chart'],
    answer: `The **Recovery Opportunity** chart ranks active retention plays by their estimated margin recovery potential.

• **Purpose:** Prioritizes retention initiatives based on clear dollar-impact projections.
• **Strategic Action:** Focus implementation on the highest-ranking play (usually "Stop Discounting Promo Trappers") for immediate profitability improvements.`
  },
  {
    keys: ['geographic state distribution', 'state performance chart', 'state performance graph', 'geo map chart', 'geographic map chart'],
    answer: `The **Geographic State Distribution** bar chart compares customer concentration and average order sizes across different US states.

• **Purpose:** Pinpoints which state-level markets are highly concentrated or underperforming.
• **Strategic Action:** Allocate advertising budget to states showing high average spend but lower overall customer counts to drive customer acquisition.`
  },
  {
    keys: ['entry category funnel', 'entry category chart', 'funnel chart', 'entry funnel graph', 'explain funnel chart'],
    answer: `The **Entry Category Funnel** chart displays the initial purchase category counts of your customers, tracing where their journey starts.

• **Purpose:** Identifies the highest-volume entry points for new customers.
• **Strategic Action:** Run customer acquisition campaigns featuring these entry products (e.g., basic Clothing or accessories) to maximize registration rates.`
  },
  {
    keys: ['category purchase frequency', 'frequency by category chart', 'frequency by category graph'],
    answer: `The **Category Purchase Frequency** chart compares how often customers buy again after their first purchase in a specific category.

• **Purpose:** Reveals which product categories are the strongest drivers of repeat purchases.
• **Strategic Action:** Promote high-frequency categories (such as accessories) to customers who just made their first purchase to boost quick second orders.`
  },
  {
    keys: ['icp comparison radar', 'icp radar chart', 'icp radar graph', 'ideal profile radar', 'explain icp chart'],
    answer: `The **ICP Comparison Radar** chart overlays the metrics of your Ideal Customer Profile against your average shopper.

• **Purpose:** Visually highlights the distinct qualities of your highest-value customers.
• **Strategic Action:** Target lookalikes matching these exact high-scoring characteristics (high spend, high frequency, zero discount reliance) for acquisition.`
  },
  {
    keys: ['charts', 'graphs', 'visualizations', 'explain the charts', 'list the charts', 'about the charts'],
    answer: `I can explain all visual charts in the system:

• **Landing Page:** *Average Ticket Size by Category*, *Demand State Distribution*
• **Customer Pyramid:** *Value Tier Composition*, *Tier Metrics Radar*
• **Promo Analysis:** *Promo Dependency vs Spend*, *Promo Rate by Tier*
• **Retention Playbook:** *Recovery Opportunity*
• **Geographic Map:** *Geographic State Distribution*
• **Category Funnel:** *Entry Category Funnel*, *Category Purchase Frequency*
• **Ideal Profile:** *ICP Comparison Radar*

Ask me about any chart specifically (e.g. *"Explain the ticket size chart"* or *"Tell me about the promo scatter plot"*).`
  },
];

// ─── Smart Pattern Matching Engine ────────────────────────

/**
 * Try to answer a general question using the local knowledge base.
 * Uses multi-strategy matching:
 * 1. Exact key phrase match
 * 2. Scored keyword overlap
 * 3. "What is X" / "Explain X" pattern extraction
 */
export function queryKnowledge(question) {
  const q = question.toLowerCase().trim()
    .replace(/[?!.,]/g, '')
    .replace(/\s+/g, ' ');

  // Strategy 1: Score each knowledge entry by keyword overlap
  let bestMatch = null;
  let bestScore = 0;

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;

    for (const key of entry.keys) {
      // Exact phrase match = highest score
      if (q.includes(key)) {
        score += key.split(' ').length * 3;
      } else {
        // Partial word matching
        const words = key.split(' ');
        for (const word of words) {
          if (word.length >= 3 && q.includes(word)) {
            score += 1;
          }
        }
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = entry;
    }
  }

  // Require a minimum score to avoid false positives
  if (bestScore >= 2 && bestMatch) {
    return bestMatch.answer;
  }

  // Strategy 2: Extract subject from "what is X" / "explain X" patterns
  const subjectPatterns = [
    /(?:what is|what's|whats|what are)\s+(?:a |an |the )?(.+)/,
    /(?:explain|describe|define|tell me about|tell me what)\s+(?:a |an |the )?(.+)/,
    /(?:how does|how do|how to|how can i)\s+(.+)/,
    /(?:what does)\s+(.+?)(?:\s+mean| stand for| do)?$/,
    /(?:meaning of|definition of)\s+(.+)/,
  ];

  for (const pattern of subjectPatterns) {
    const match = q.match(pattern);
    if (match) {
      const subject = match[1].trim();
      // Re-search with extracted subject
      for (const entry of KNOWLEDGE_BASE) {
        for (const key of entry.keys) {
          if (key.includes(subject) || subject.includes(key)) {
            return entry.answer;
          }
        }
      }
    }
  }

  // No match found
  return null;
}

// ─── Get a smart fallback response ────────────────────────

export function getSmartFallback(question) {
  return `I don't have a built-in answer for that specific question yet.

**I can answer questions about:**
• Marketing — RFM, CLV, churn, retention, segmentation, email, loyalty programs
• Analytics — Machine learning, regression, clustering, statistics, SQL, Python
• Business — ROI, SWOT, pricing, branding, CRM, supply chain, KPIs
• Finance — Revenue, margins, break-even, CAC, AOV
• Strategy — Action plans, memos, elevator pitches, A/B testing
• Customer data — Tiers, geography, promos, demographics (from your live dataset)

Try asking something like:
• "What is RFM analysis?"
• "How to reduce churn?"
• "Write a retention email"
• "What is customer lifetime value?"`;
}
