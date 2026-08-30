import type { ReactNode } from "react";
import { Brand } from "./brand";
export function ContentPage({ eyebrow, title, intro, children }: { eyebrow: string; title: string; intro: string; children: ReactNode }) { return <main><header><Brand/></header><article className="content-page"><span className="eyebrow">{eyebrow}</span><h1>{title}</h1><p className="content-intro">{intro}</p>{children}</article></main>; }
