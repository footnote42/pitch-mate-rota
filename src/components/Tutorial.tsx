import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ChevronRight, ChevronLeft, Users, Grid3x3, Scale, Share2 } from 'lucide-react';

interface TutorialProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const tutorialSteps = [
  {
    title: "Add Your Squad",
    description: "Start by adding your players with their names and experience levels. Mix of experience helps everyone develop!",
    icon: Users,
    color: "text-blue-500",
  },
  {
    title: "Build Your Rotations",
    description: "Click cells to assign players to game halves. Fill each half with the required number of players for your selected age group.",
    icon: Grid3x3,
    color: "text-green-500",
  },
  {
    title: "Balance Experience",
    description: "Watch the balance indicators to mix experienced players with newer ones. Everyone gets fair playing time!",
    icon: Scale,
    color: "text-amber-500",
  },
  {
    title: "Share When Ready",
    description: "All set? Share your rotation plan with parents and coaches via WhatsApp or save for game day.",
    icon: Share2,
    color: "text-purple-500",
  },
];

export const Tutorial = ({ open, onOpenChange }: TutorialProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem('tutorial-completed', 'true');
    onOpenChange(false);
    setCurrentStep(0);
  };

  const handleSkip = () => {
    localStorage.setItem('tutorial-completed', 'true');
    onOpenChange(false);
    setCurrentStep(0);
  };

  // Reset to first step when dialog opens
  useEffect(() => {
    if (open) {
      setCurrentStep(0);
    }
  }, [open]);

  const currentStepData = tutorialSteps[currentStep];
  const Icon = currentStepData.icon;
  const isLastStep = currentStep === tutorialSteps.length - 1;
  const isFirstStep = currentStep === 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className={`h-6 w-6 ${currentStepData.color}`} />
            {currentStepData.title}
          </DialogTitle>
          <DialogDescription className="pt-2">
            {currentStepData.description}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          {/* Step indicators */}
          <div className="flex justify-center gap-2">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={`h-2 w-2 rounded-full transition-all ${
                  index === currentStep
                    ? 'bg-primary w-6'
                    : index < currentStep
                    ? 'bg-primary/50'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {tutorialSteps.length}
          </p>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {!isLastStep ? (
            <>
              <Button
                variant="ghost"
                onClick={handleSkip}
                className="w-full sm:w-auto"
              >
                Skip Tutorial
              </Button>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  disabled={isFirstStep}
                  className="flex-1 sm:flex-initial"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Back
                </Button>
                <Button
                  onClick={handleNext}
                  className="flex-1 sm:flex-initial"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </>
          ) : (
            <Button
              onClick={handleComplete}
              className="w-full"
            >
              Get Started!
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
