import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Feather, Scroll, ArrowRight, Upload, Edit3 } from "lucide-react";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div className="min-h-screen bg-background font-literary overflow-hidden">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 opacity-[0.02]">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--literary-sage)) 2px, transparent 2px)`,
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Header */}
      <header className="relative z-10 px-6 py-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-literary-sage/10 rounded-full">
              <Feather className="h-6 w-6 text-literary-sage" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Verse</h1>
              <p className="text-xs text-muted-foreground italic">A companion for poets</p>
            </div>
          </div>
          <Badge variant="secondary" className="font-literary text-xs">
            <Scroll className="h-3 w-3 mr-1" />
            Beta
          </Badge>
        </div>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 py-16">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Headline */}
          <div className="mb-8">
            <h2 className="text-5xl md:text-6xl font-literary font-bold text-foreground mb-4 leading-tight">
              Refine Your
              <span className="block text-literary-sage italic">Poetic Voice</span>
            </h2>
            <p className="text-xl md:text-2xl text-muted-foreground font-literary italic max-w-2xl mx-auto leading-relaxed">
              A gentle companion that helps you explore the edges of your style, 
              guided by the masters of language
            </p>
          </div>

          {/* Poetic Quote */}
          <div className="mb-12 p-8 border border-literary-sage/20 rounded-lg bg-literary-sage/5 max-w-2xl mx-auto">
            <blockquote className="text-lg font-literary italic text-literary-ink leading-relaxed">
              "The best words in the best order"
            </blockquote>
            <cite className="text-sm text-muted-foreground mt-2 block">
              — Samuel Taylor Coleridge
            </cite>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
            <Link to="/write">
              <Button size="lg" className="font-literary text-base px-8 py-6 group">
                <Edit3 className="h-5 w-5 mr-2 group-hover:translate-x-1 transition-transform" />
                Begin Writing
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
            <Link to="/write?upload=true">
              <Button variant="outline" size="lg" className="font-literary text-base px-8 py-6 group">
                <Upload className="h-5 w-5 mr-2 group-hover:-translate-y-1 transition-transform" />
                Upload a Poem
              </Button>
            </Link>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-12 h-12 bg-literary-sage/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-literary-sage/20 transition-colors">
                <Feather className="h-6 w-6 text-literary-sage" />
              </div>
              <h3 className="font-literary font-semibold text-lg mb-2 text-foreground">Writing Examples</h3>
              <p className="text-muted-foreground font-literary">
                Explore local writing examples for rhythm, rhyme, and tone
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-literary-sage/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-literary-sage/20 transition-colors">
                <Scroll className="h-6 w-6 text-literary-sage" />
              </div>
              <h3 className="font-literary font-semibold text-lg mb-2 text-foreground">Master Voices</h3>
              <p className="text-muted-foreground font-literary">
                Learn from Dickinson, Rimbaud, Ocean Vuong, and other legendary poets
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-12 h-12 bg-literary-sage/10 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-literary-sage/20 transition-colors">
                <Edit3 className="h-6 w-6 text-literary-sage" />
              </div>
              <h3 className="font-literary font-semibold text-lg mb-2 text-foreground">Your Voice</h3>
              <p className="text-muted-foreground font-literary">
                Suggestions that inspire and extend, never overwrite your unique style
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 mt-24 py-12 border-t border-muted bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm text-muted-foreground font-literary italic mb-4">
            "I dwell in possibility — a fairer house than prose"
          </p>
          <p className="text-xs text-muted-foreground">
            — Emily Dickinson
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing;