export type FingerId = "left-pinky" | "left-ring" | "left-middle" | "left-index" | "right-index" | "right-middle" | "right-ring" | "right-pinky" | "thumb";
export type TeachingStep = { title: string; detail: string; kind: "anchor" | "hand" | "movement" };
export type Lesson = { id: string; number: number; title: string; summary: string; theory: string; goal: string; keys: string[]; target: string; passAccuracy: number; technique: "home" | "space" | "shift" | "reach"; steps: TeachingStep[] };

export const fingerLabels: Record<FingerId, string> = { "left-pinky":"Left pinky", "left-ring":"Left ring", "left-middle":"Left middle", "left-index":"Left index", "right-index":"Right index", "right-middle":"Right middle", "right-ring":"Right ring", "right-pinky":"Right pinky", thumb:"Thumb" };
export const fingerByKey: Record<string, FingerId> = {
  "1":"left-pinky",q:"left-pinky",a:"left-pinky",z:"left-pinky",
  "2":"left-ring",w:"left-ring",s:"left-ring",x:"left-ring",
  "3":"left-middle",e:"left-middle",d:"left-middle",c:"left-middle",
  "4":"left-index","5":"left-index",r:"left-index",t:"left-index",f:"left-index",g:"left-index",v:"left-index",b:"left-index",
  "6":"right-index","7":"right-index",y:"right-index",u:"right-index",h:"right-index",j:"right-index",n:"right-index",m:"right-index",
  "8":"right-middle",i:"right-middle",k:"right-middle",",":"right-middle",
  "9":"right-ring",o:"right-ring",l:"right-ring",".":"right-ring",
  "0":"right-pinky",p:"right-pinky",";":"right-pinky","/":"right-pinky"," ":"thumb",
  "shift-left":"left-pinky","shift-right":"right-pinky",
  "'":"right-pinky","[":"right-pinky","]":"right-pinky","-":"right-pinky","=":"right-pinky",
};

export const shiftedKeys: Record<string, string> = { "!":"1", "@":"2", "#":"3", "$":"4", "%":"5", "^":"6", "&":"7", "*":"8", "(":"9", ")":"0", ":":";", '"':"'", "?":"/", "<":",", ">":".", "_":"-", "+":"=", "{":"[", "}":"]" };
export function physicalKey(key: string) { return shiftedKeys[key] || key.toLowerCase(); }
export function needsShift(key: string) { return isUppercaseLetter(key) || key in shiftedKeys; }

const homeSteps: TeachingStep[] = [
  { kind:"anchor", title:"Find f and j", detail:"Use the raised markers without looking down." },
  { kind:"hand", title:"Rest on the home row", detail:"Left hand on asdf, right hand on jkl;." },
  { kind:"movement", title:"Return after every press", detail:"Move only the assigned finger, then return it home." },
];

const extensions = [
  { id:"top-index", title:"Top row: r and u", keys:["r","u"], target:"frf juj fur rug rush sugar guard", summary:"Reach up with your index fingers." },
  { id:"top-middle", title:"Top row: e and i", keys:["e","i"], target:"ded kik red ride fire slide field", summary:"Reach up from d and k with your middle fingers." },
  { id:"top-ring", title:"Top row: w and o", keys:["w","o"], target:"sws lol low slow word wood flower", summary:"Use your ring fingers for w and o." },
  { id:"top-pinky", title:"Top row: q and p", keys:["q","p"], target:"aqa ;p; quip equip equal paper power", summary:"Reach gently with the pinkies, then return home." },
  { id:"top-inner", title:"Top row: t and y", keys:["t","y"], target:"ftf jyj type quiet try trust your style", summary:"Let each index finger cover its inner top-row key." },
  { id:"bottom-index", title:"Bottom row: v and m", keys:["v","m"], target:"fvf jmj move five vivid movie smile", summary:"Reach down with your index fingers." },
  { id:"bottom-middle", title:"Bottom row: c and comma", keys:["c",","], target:"dcd k,k calm, clear, clever, music,", summary:"Use the middle fingers for c and comma." },
  { id:"bottom-ring", title:"Bottom row: x and period", keys:["x","."], target:"sxs l.l mix. six. relax. exercise.", summary:"Use the ring fingers for x and period." },
  { id:"bottom-pinky", title:"Bottom row: z and slash", keys:["z","/"], target:"aza ;/; zero / size / quiz / lazy", summary:"Use a light pinky reach for z and slash." },
  { id:"bottom-inner", title:"Bottom row: b and n", keys:["b","n"], target:"fbf jnj begin bright bring balance learn", summary:"Reach down and inward with the index fingers." },
  { id:"numbers-left", title:"Numbers: left hand", keys:["1","2","3","4","5"], target:"a1a s2s d3d f4f f5f 12 34 45 51", summary:"Reach from the home row to numbers 1 through 5." },
  { id:"numbers-right", title:"Numbers: right hand", keys:["6","7","8","9","0"], target:"j6j j7j k8k l9l ;0; 67 89 90 2026", summary:"Add numbers 6 through 0 with your right hand." },
  { id:"punctuation", title:"Quotes and punctuation", keys:["'",":","?","!"], target:"it's clear. is it? yes! time: 10:30", summary:"Use the right pinky for quotes; use opposite Shift for symbols." },
  { id:"capitals", title:"Capitals across the keyboard", keys:[..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"], target:"ABCDEFGHIJKLMNOPQRSTUVWXYZ Begin Now Read Type Each Idea Calm Move", summary:"Apply opposite-hand Shift to every row." },
  { id:"sentences", title:"Build a steady sentence rhythm", keys:[".",",","?","!"], target:"Read ahead, then type. Bring calm hands to every word. Is it clear? Yes!", summary:"Combine the keyboard in complete sentences." },
];

const spaceSteps: TeachingStep[] = [
  { kind:"anchor", title:"Keep eight fingers home", detail:"Leave asdf and jkl; in their resting positions." },
  { kind:"hand", title:"Choose one thumb", detail:"Use the same comfortable thumb for every space." },
  { kind:"movement", title:"Tap once and release", detail:"Do not move your hands or press two spaces." },
];
const shiftSteps: TeachingStep[] = [
  { kind:"anchor", title:"Use the opposite hand", detail:"For a left-hand letter, hold the right Shift key." },
  { kind:"hand", title:"Hold Shift with the pinky", detail:"Keep the letter finger ready on its home position." },
  { kind:"movement", title:"Press, release, return", detail:"Hold Shift, press the letter, then release both keys." },
];

export const beginnerLessons: Lesson[] = [
  { id:"anchors", number:1, title:"Find f and j", summary:"Place both index fingers on the raised f and j keys.", theory:"Touch typing gives every finger a fixed starting place. The raised marks on f and j let you find that place without looking down.", goal:"Learn the two anchor keys and return your index fingers to them after every press.", keys:["f","j"], target:"fjjffjjffj", passAccuracy:90, technique:"home", steps:homeSteps },
  { id:"space", number:2, title:"Use the spacebar", summary:"Keep both hands home and tap space with one thumb.", theory:"A space separates words, but your hands should not leave the home row to make it. One thumb handles each space while the other fingers remain ready.", goal:"Make one clean space without shifting either hand.", keys:[" "], target:"f j f j fj jf", passAccuracy:92, technique:"space", steps:spaceSteps },
  { id:"index", number:3, title:"Index fingers", summary:"Keep your other fingers resting while the index fingers alternate.", theory:"Your index fingers guide the hand position. Alternating them builds control without asking the other fingers to move.", goal:"Alternate f and j while both hands stay relaxed.", keys:["f","j"], target:"fff jjj fj fj jf jf fjjf", passAccuracy:92, technique:"home", steps:homeSteps },
  { id:"middle", number:4, title:"Middle fingers", summary:"Add d and k, then return each finger to its home key.", theory:"The middle fingers rest beside the index fingers: left middle on d and right middle on k. Each finger owns its key.", goal:"Press d and k independently without moving your index fingers.", keys:["d","k"], target:"ddd kkk dk kd fd jk df kj", passAccuracy:92, technique:"home", steps:homeSteps },
  { id:"ring", number:5, title:"Ring fingers", summary:"Add s and l without moving the rest of each hand.", theory:"Ring fingers have less independent movement, so accuracy matters more than speed. They rest on s and l.", goal:"Use a light press and keep the neighboring fingers settled.", keys:["s","l"], target:"sss lll sl ls sdf lkj", passAccuracy:93, technique:"home", steps:homeSteps },
  { id:"pinky", number:6, title:"Pinky fingers", summary:"Add a and semicolon with a light touch.", theory:"The pinkies complete the outside of the home row. The left pinky owns a and the right pinky owns semicolon.", goal:"Reach the outside keys without rotating your wrists.", keys:["a",";"], target:"aaa ;;; a; ;a salad flask", passAccuracy:93, technique:"home", steps:homeSteps },
  { id:"reach", number:7, title:"Index reach", summary:"Reach inward for g and h, then return to f and j.", theory:"The index fingers each cover two home-row keys. They reach inward for g and h, then return to the raised anchors.", goal:"Move only the index finger and recover the home position after every reach.", keys:["g","h"], target:"fgh jhg g h had half flash", passAccuracy:94, technique:"home", steps:homeSteps },
  { id:"home-row", number:8, title:"Complete home row", summary:"Use every home-row key with the assigned finger.", theory:"The home row is your base for the entire keyboard. Correct finger ownership makes later reaches predictable and reduces hand movement.", goal:"Combine every home-row key while preserving finger ownership.", keys:["a","s","d","f","g","h","j","k","l",";"], target:"asdf jkl; fdsa ;lkj ask dad fall glass", passAccuracy:95, technique:"home", steps:homeSteps },
  { id:"words", number:9, title:"Home-row words", summary:"Build control with short words made from home-row keys.", theory:"Typing words changes isolated movements into rhythm. Read slightly ahead, but press only the character currently expected.", goal:"Keep an even rhythm through spaces and repeated letters.", keys:["a","s","d","f","g","h","j","k","l",";"], target:"a lad asks dad a flask falls all flags had glass", passAccuracy:95, technique:"home", steps:homeSteps },
  { id:"uppercase", number:10, title:"Capital letters with Shift", summary:"Hold Shift with the opposite pinky while pressing a letter.", theory:"A capital is made by holding Shift while pressing a letter. Use the Shift key on the opposite hand so the letter finger can move freely.", goal:"Coordinate two hands, then release both keys and return home.", keys:["F","J","D","K","S","L","A"], target:"F J D K S L A F J", passAccuracy:95, technique:"shift", steps:shiftSteps },
];

extensions.forEach((item, index) => {
  beginnerLessons.push({ ...item, number: index + 11, passAccuracy: 95, technique: "reach",
    theory: `${item.summary} Keep your wrists relaxed and return each finger to its home key after a reach. Accuracy comes before speed.`,
    goal: "Complete two varied rounds with at least 95% accuracy. Keep your hands relaxed.",
    steps: [
      { kind:"anchor", title:"Start from the home row", detail:"Find f and j by touch, with the other fingers on asdf and jkl;." },
      { kind:"hand", title:"Check the finger map", detail:"The highlighted key and finger guide show which finger makes the reach. Use opposite-hand Shift for capitals and symbols." },
      { kind:"movement", title:"Reach and return", detail:"Move the assigned finger, press lightly, and return home before the next key." },
    ],
  });
});

export function keyLabel(key: string) { return key === " " ? "Space" : key; }
export function isUppercaseLetter(key: string) { return /^[A-Z]$/.test(key); }
export function fingersForExpectedKey(key: string): FingerId[] {
  if (key === " ") return ["thumb"];
  const letterFinger = fingerByKey[physicalKey(key)] || "thumb";
  if (!needsShift(key)) return [letterFinger];
  return [letterFinger, letterFinger.startsWith("left") ? "right-pinky" : "left-pinky"];
}
