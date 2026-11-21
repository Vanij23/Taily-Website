# Taily

**Learning money by experiencing it.** A single-player financial simulation game for Indian students and first-time earners (ages 16-25). Players live a year of real money decisions with virtual money, and every choice carries into the months that follow.

**Play it live:** [add your Vercel link here]

## Learning pillars

1. **Earning:** understanding income and available money
2. **Saving first:** putting savings aside before spending
3. **Tracking:** knowing where the money goes
4. **Decisions:** balancing needs, wants and surprise costs
5. **Investing:** risk, return and long-term growth (never shown as guaranteed)

## How it works

```mermaid
flowchart LR
    A[Setup] --> B[Month opening]
    B --> C[Event cards]
    C --> D{Broke or burnout?}
    D -- yes --> E[Lose screen] -- replay the month --> B
    D -- no --> F[Month end] -- next month --> B
```

- **Setup:** choose a life (school student, college student or first-job earner), an optional name, and a year goal. The game divides the goal by 12 to set a monthly saving target.
- **Month opening:** money arrives, fixed costs are paid automatically, and the player sets aside savings first, then splits the rest between Needs and Wants.
- **Event cards:** 8 everyday situations a month, each with 3 choices. Results show right away, and Taily reacts in one line.
- **Month end:** a chart of where the money went, with each want tagged *worth it* or *regret*, plus stars, badges and a streak.

## The 4 meters

| Meter | Meaning |
| --- | --- |
| Needs | Buffer for things that break or go wrong |
| Wants | Money for fun, food and friends |
| Save | Goal money and safety cushion |
| Happiness | 0-100, drops from stress; only wants refill it |

## Consequences

Choices show up now, later in the month, next month and on the goal. Skipping a need leads to a bigger problem later, pay-later adds an instalment to next month's bills, and dipping into savings pushes the goal date back.

## The Bazaar (investing)

Unlocks once enough is saved. It teaches one formula: **Safe → Spread → Stay.**

- **Safe:** only money beyond the cushion can be invested
- **Spread:** three stalls: Steady (low risk), Market (goes up and down) and Hot tip (very high risk)
- **Stay:** monthly news cards include a market drop, and holding beats panic-selling

Verdicts judge the decision, not luck. The year ends with a scorecard and a 10-year fast-forward shown as a **range**, never a promise.

## Book-inspired levels

Each monthly level is built on one idea from a story-based finance book, such as *The Richest Man in Babylon*, *The Psychology of Money*, *Let's Talk Money* and *Rupee Tales*. Players play the idea first, then unlock the book on Taily's Bookshelf.

## Run locally

```
git clone https://github.com/Vanij23/Taily-Website.git
cd Taily-Website
```

Then double-click `index.html`. No build step or dependencies are needed.

## Project structure

```
Taily-Website/
├── index.html    # The complete game, ready to run
├── source/       # Source files
└── README.md
```

## Deployment

Hosted on Vercel and connected to this repository. Every push to `main` redeploys the site automatically.

## Author
Divya




