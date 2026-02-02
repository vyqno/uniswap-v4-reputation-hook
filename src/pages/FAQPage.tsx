import { Link } from "react-router-dom";
import { FadeIn, StaggerContainer, StaggerItem } from "@/components/animations/FadeIn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { SOCIAL_LINKS } from "@/lib/constants";

const faqs = [
  {
    category: "Getting Started",
    questions: [
      {
        q: "What is the Reputation Hook?",
        a: "The Reputation Hook is a Uniswap V4 hook that rewards long-term users with lower trading fees. By registering your wallet with a small bond, you can earn up to 75% discounts on swap fees based on how long you've been a member.",
      },
      {
        q: "How much does it cost to register?",
        a: "Registration requires a 0.001 ETH bond (approximately $3.50 USD). This bond is fully refundable after the 30-day cooldown period, and you keep your accumulated reputation even after withdrawal.",
      },
      {
        q: "How do I get started?",
        a: "Simply connect your wallet, navigate to the Register page, accept the terms, and confirm the transaction. Your reputation will activate 24 hours after registration, and you'll start receiving discounted fees immediately.",
      },
    ],
  },
  {
    category: "Tier System",
    questions: [
      {
        q: "How do the tiers work?",
        a: "There are 4 tiers based on how long you've held your reputation. Tier 1 (0+ days): 0% discount, Tier 2 (30+ days): 25% discount, Tier 3 (90+ days): 50% discount, Tier 4 (180+ days): 75% discount. You automatically progress through tiers as time passes.",
      },
      {
        q: "Do I need to do anything to tier up?",
        a: "No! Tier progression is completely automatic. As long as you maintain your registration, you'll automatically move to higher tiers when you reach the required time thresholds.",
      },
      {
        q: "What happens to my tier if I withdraw my bond?",
        a: "You keep your accumulated reputation age even after withdrawing your bond. If you re-register later, you'll continue from where you left off rather than starting from Tier 1.",
      },
    ],
  },
  {
    category: "Fees & Savings",
    questions: [
      {
        q: "How much can I save?",
        a: "At Tier 4, you save 75% on swap fees. For example, if the base fee is 0.30%, your fee would be just 0.075%. On a $10,000 swap, you'd save $22.50 per trade.",
      },
      {
        q: "Does the discount apply to all pools?",
        a: "The reputation discount applies to pools that use the Reputation Fee Hook. Not all Uniswap V4 pools use this hook, so check the pool details before swapping.",
      },
      {
        q: "Is there a minimum swap amount?",
        a: "No, the reputation discount applies to swaps of any size. However, for very small swaps, gas costs may exceed the savings.",
      },
    ],
  },
  {
    category: "Security & Technical",
    questions: [
      {
        q: "Is my bond safe?",
        a: "Yes, your bond is held in a smart contract on the Ethereum blockchain. The contract has been audited and the code is open source. You can withdraw your bond at any time after the 30-day cooldown period.",
      },
      {
        q: "Why is there a 24-hour activation delay?",
        a: "The activation delay prevents users from gaming the system by quickly registering, making a discounted trade, and withdrawing. It ensures the reputation system rewards genuine long-term users.",
      },
      {
        q: "What network is this on?",
        a: "The Reputation Hook is currently deployed on Sepolia testnet. Mainnet deployment will follow after thorough testing.",
      },
    ],
  },
];

export default function FAQPage() {
  return (
    <div className="min-h-screen py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn>
          <div className="text-center mb-16">
            <h1 className="font-display text-4xl sm:text-5xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-foreground-secondary max-w-2xl mx-auto">
              Everything you need to know about the Reputation Hook system
            </p>
          </div>
        </FadeIn>

        {/* FAQ Categories */}
        <StaggerContainer className="space-y-8">
          {faqs.map((category) => (
            <StaggerItem key={category.category}>
              <Card variant="glass" padding="lg">
                <h2 className="font-display text-xl font-semibold text-foreground mb-6">
                  {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.questions.map((faq, index) => (
                    <AccordionItem
                      key={index}
                      value={`item-${index}`}
                      className="border-white/10"
                    >
                      <AccordionTrigger className="text-foreground hover:text-brand-400 text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-foreground-secondary">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </Card>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {/* Still have questions? */}
        <FadeIn delay={0.4}>
          <Card variant="glow" className="mt-12 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-500/10 via-transparent to-brand-600/5" />
            <div className="relative p-8 text-center">
              <MessageCircle className="h-12 w-12 text-brand-500 mx-auto mb-4" />
              <h3 className="font-display text-2xl font-bold text-foreground mb-2">
                Still have questions?
              </h3>
              <p className="text-foreground-secondary mb-6">
                Join our Discord community or check out the documentation
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <a href={SOCIAL_LINKS.discord} target="_blank" rel="noopener noreferrer">
                  <Button variant="brand" size="lg">
                    Join Discord
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </a>
                <a href={SOCIAL_LINKS.docs} target="_blank" rel="noopener noreferrer">
                  <Button variant="secondary" size="lg">
                    Read Docs
                  </Button>
                </a>
              </div>
            </div>
          </Card>
        </FadeIn>
      </div>
    </div>
  );
}
