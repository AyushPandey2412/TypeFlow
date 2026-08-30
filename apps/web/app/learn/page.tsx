import type { Metadata } from "next"; import { LearningWorkspace } from "../../features/learn/learning-workspace";
export const metadata:Metadata={title:"Learn Touch Typing",description:"Learn home-row finger placement with guided keyboard lessons and visual finger instructions.",alternates:{canonical:"/learn"}};
export default function LearnPage(){return <LearningWorkspace/>}
