import type { Metadata } from "next"; import { LearningWorkspace } from "../../features/learn/learning-workspace";
export const metadata:Metadata={title:"Learn Touch Typing",description:"Learn touch typing with 25 guided lessons, visual finger instructions, personalized key drills, and progress tracking from home row to full sentences.",alternates:{canonical:"/learn"}};
export default function LearnPage(){return <LearningWorkspace/>}
