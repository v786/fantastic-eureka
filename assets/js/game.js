const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

const W = 50, H = 37, TILE = 16;
const COLORS = {
  floor: "#25242b",
  wall: "#55505a",
  explored: "#15151a",
  player: "#f3d37b",
  goblin: "#82bd70",
  orc: "#cf6868",
  potion: "#e66bb0",
  gold: "#edca58",
  stairs: "#80c6dc"
};

let map, visible, explored, monsters, items;
let player, depth, gameOver, turn;
let messages = [];

const CLASS_STATS = {
  vanguard: {name:"Vanguard", maxHp:42, atk:5, potions:2},
  ranger: {name:"Ranger", maxHp:34, atk:6, potions:3},
  arcanist: {name:"Arcanist", maxHp:28, atk:8, potions:4}
};

const SKILLS = {
  vanguard: [
    {id:"iron_skin",name:"Iron Skin",desc:"Gain 8 maximum HP.",cost:1,requires:null,apply:p=>{p.maxHp+=8;p.hp+=8;}},
    {id:"cleave",name:"Cleave",desc:"Increase attack by 3.",cost:1,requires:null,apply:p=>p.atk+=3},
    {id:"juggernaut",name:"Juggernaut",desc:"Gain 12 maximum HP and 2 attack.",cost:2,requires:"cleave",apply:p=>{p.maxHp+=12;p.hp+=12;p.atk+=2;}}
  ],
  ranger: [
    {id:"fleet",name:"Fleet-Footed",desc:"Enemies deal 1 less damage.",cost:1,requires:null,apply:p=>p.damageReduction=(p.damageReduction||0)+1},
    {id:"keen_eye",name:"Keen Eye",desc:"Increase attack by 3.",cost:1,requires:null,apply:p=>p.atk+=3},
    {id:"wildcraft",name:"Wildcraft",desc:"Gain 2 potions and 8 maximum HP.",cost:2,requires:"keen_eye",apply:p=>{p.potions+=2;p.maxHp+=8;p.hp+=8;}}
  ],
  arcanist: [
    {id:"arcane_focus",name:"Arcane Focus",desc:"Increase attack by 4.",cost:1,requires:null,apply:p=>p.atk+=4},
    {id:"mana_blood",name:"Mana Blood",desc:"Gain 10 maximum HP.",cost:1,requires:null,apply:p=>{p.maxHp+=10;p.hp+=10;}},
    {id:"archmage",name:"Archmage",desc:"Gain 6 attack and 2 potions.",cost:2,requires:"arcane_focus",apply:p=>{p.atk+=6;p.potions+=2;}}
  ]
};

function log(msg) {
  messages.unshift(msg);
  messages = messages.slice(0, 7);
  document.getElementById("log").innerHTML =
    messages.map(m => `<div>${m}</div>`).join("");
}

function random(min, max) {
  return Math.floor(Math.random() * (max-min+1))+min;
}

function openClassModal() {
  document.getElementById("classModal").classList.remove("hidden");
}

function restart() {
  openClassModal();
}

function startGame(classId) {
  const stats=CLASS_STATS[classId];
  depth = 1;
  gameOver = false;
  messages = [];
  player = {
    x:0,y:0,hp:stats.maxHp,maxHp:stats.maxHp,
    atk:stats.atk,gold:0,potions:stats.potions,
    weapon:"Rusty sword",classId,
    characterLevel:1,xp:0,xpNeeded:40,skillPoints:0,
    learnedSkills:[],damageReduction:0
  };
  document.getElementById("classModal").classList.add("hidden");
  document.getElementById("skillModal").classList.add("hidden");
  generateDungeon();
  log("You awaken in the depths as a "+stats.name+"...");
}

function generateDungeon() {
  map = Array.from({length:H}, () => Array(W).fill(1));
  visible = Array.from({length:H}, () => Array(W).fill(false));
  explored = explored || Array.from({length:H}, () => Array(W).fill(false));
  monsters = [];
  items = [];
  let rooms = [];

  for(let i=0; i<80 && rooms.length<10; i++) {
    let w = random(5,11);
    let h = random(4,8);
    let x = random(1,W-w-2);
    let y = random(1,H-h-2);

    if(rooms.some(r =>
      x < r.x+r.w+2 && x+w+2 > r.x &&
      y < r.y+r.h+2 && y+h+2 > r.y
    )) continue;

    let room = {x,y,w,h};
    rooms.push(room);

    for(let yy=y; yy<y+h; yy++)
      for(let xx=x; xx<x+w; xx++)
        map[yy][xx] = 0;

    if(rooms.length>1) {
      let prev = rooms[rooms.length-2];
      let cx = Math.floor(x+w/2);
      let cy = Math.floor(y+h/2);
      let px = Math.floor(prev.x+prev.w/2);
      let py = Math.floor(prev.y+prev.h/2);

      for(let xx=Math.min(cx,px); xx<=Math.max(cx,px); xx++)
        map[py][xx] = 0;
      for(let yy=Math.min(cy,py); yy<=Math.max(cy,py); yy++)
        map[yy][cx] = 0;
    }
  }

  if(rooms.length===0) return generateDungeon();

  let first = rooms[0];
  player.x = Math.floor(first.x+first.w/2);
  player.y = Math.floor(first.y+first.h/2);

  let last = rooms[rooms.length-1];
  let sx = Math.floor(last.x+last.w/2);
  let sy = Math.floor(last.y+last.h/2);
  map[sy][sx] = 2;

  rooms.slice(1).forEach(room => {
    if(Math.random()<0.8) {
      let x=random(room.x+1,room.x+room.w-2);
      let y=random(room.y+1,room.y+room.h-2);
      monsters.push({
        x,y,
        hp: depth>3 ? 12:8,
        atk: depth>3 ? 4:2,
        type: Math.random()<0.7 ? "goblin":"orc",
        symbol: Math.random()<0.7 ? "g":"o"
      });
    }

    if(Math.random()<0.7) {
      items.push({
        x:random(room.x+1,room.x+room.w-2),
        y:random(room.y+1,room.y+room.h-2),
        type:Math.random()<0.6 ? "gold":"potion"
      });
    }
  });

  // Add a guaranteed weapon upgrade on deeper levels.
  if(depth%3===0) {
    let room=rooms[rooms.length-1];
    items.push({
      x:room.x+1,y:room.y+1,type:"weapon"
    });
  }

  explored = Array.from({length:H}, () => Array(W).fill(false));
  updateVisibility();
  updateUI();
}

function updateVisibility() {
  visible = Array.from({length:H}, () => Array(W).fill(false));
  for(let y=Math.max(0,player.y-7);y<=Math.min(H-1,player.y+7);y++) {
    for(let x=Math.max(0,player.x-7);x<=Math.min(W-1,player.x+7);x++) {
      if(Math.hypot(x-player.x,y-player.y)<=7) {
        visible[y][x]=true;
        explored[y][x]=true;
      }
    }
  }
}

function monsterAt(x,y) {
  return monsters.find(m=>m.x===x&&m.y===y);
}

function itemAt(x,y) {
  return items.find(m=>m.x===x&&m.y===y);
}

function move(dx,dy) {
  if(gameOver) return;

  let x=player.x+dx, y=player.y+dy;
  if(x<0||y<0||x>=W||y>=H) return;

  let monster=monsterAt(x,y);
  if(monster) {
    monster.hp-=player.atk;
    log("You hit the "+monster.type+" for "+player.atk+" damage!");

    if(monster.hp<=0) {
      monsters=monsters.filter(m=>m!==monster);
      player.gold+=random(2,8);
      gainXP(monster.type==="orc"?35:25);
      log("The "+monster.type+" dies. You find gold!");
    }
    endTurn();
    return;
  }

  if(map[y][x]===1) return;

  player.x=x;
  player.y=y;

  if(map[y][x]===2) {
    descend();
    return;
  }

  let item=itemAt(x,y);
  if(item) pickup(item);

  endTurn();
}

function pickup(item) {
  if(item.type==="gold") {
    player.gold+=random(5,15);
    log("You collect gold!");
  } else if(item.type==="potion") {
    player.potions++;
    log("You found a health potion!");
  } else if(item.type==="weapon") {
    player.atk+=3;
    player.weapon="Enchanted blade";
    log("You found an enchanted blade! Attack increased.");
  }
  items=items.filter(i=>i!==item);
}

function pickupAction() {
  let item=itemAt(player.x,player.y);
  if(item) pickup(item);
  else log("There is nothing here.");
  render();
}

function usePotion() {
  if(gameOver) return;
  if(player.potions<=0) {
    log("You have no potions!");
    return;
  }
  if(player.hp===player.maxHp) {
    log("Your health is already full.");
    return;
  }
  player.potions--;
  let heal=Math.min(15,player.maxHp-player.hp);
  player.hp+=heal;
  log("You recover "+heal+" HP.");
  endTurn();
}

function descend() {
  depth++;
  player.maxHp+=2;
  player.hp=Math.min(player.maxHp,player.hp+8);
  log("You descend to dungeon level "+depth+"...");
  generateDungeon();
  render();
}

function gainXP(amount) {
  player.xp+=amount;
  while(player.xp>=player.xpNeeded) {
    player.xp-=player.xpNeeded;
    player.characterLevel++;
    player.skillPoints++;
    player.xpNeeded=Math.floor(player.xpNeeded*1.35);
    player.maxHp+=5;
    player.hp=Math.min(player.maxHp,player.hp+12);
    player.atk++;
    log("Level up! You are now level "+player.characterLevel+". Skill point gained!");
  }
}

function openSkills() {
  if(gameOver) return;
  renderSkillTree();
  document.getElementById("skillModal").classList.remove("hidden");
}

function closeSkills() {
  document.getElementById("skillModal").classList.add("hidden");
}

function renderSkillTree() {
  if(!player) return;
  document.getElementById("skillPointsHeader").textContent=
    "Available skill points: "+player.skillPoints;
  document.getElementById("skillGrid").innerHTML=SKILLS[player.classId].map(skill=>{
    const learned=player.learnedSkills.includes(skill.id);
    const requirementMet=!skill.requires||player.learnedSkills.includes(skill.requires);
    const canLearn=!learned&&requirementMet&&player.skillPoints>=skill.cost;
    let status=learned?"LEARNED":(requirementMet?"Learn ("+skill.cost+" pt)":"Locked");
    return '<div class="skill '+(learned?'learned':(!requirementMet?'locked':''))+'">'+
      '<div class="skill-name">'+skill.name+'</div><div class="skill-desc">'+skill.desc+'</div>'+ 
      '<button '+(!canLearn?'disabled':'')+' onclick="learnSkill(\''+skill.id+'\')">'+status+'</button></div>';
  }).join("");
}

function learnSkill(skillId) {
  const skill=SKILLS[player.classId].find(s=>s.id===skillId);
  if(!skill||player.learnedSkills.includes(skillId)) return;
  if(skill.requires&&!player.learnedSkills.includes(skill.requires)) return;
  if(player.skillPoints<skill.cost) return;
  player.skillPoints-=skill.cost;
  player.learnedSkills.push(skillId);
  skill.apply(player);
  log("You learned "+skill.name+".");
  updateUI();
  renderSkillTree();
}

function endTurn() {
  if(gameOver) return;

  monsters.forEach(m=>{
    let dx=player.x-m.x;
    let dy=player.y-m.y;
    let dist=Math.abs(dx)+Math.abs(dy);

    if(dist===1) {
      const damage=Math.max(1,m.atk-(player.damageReduction||0));
      player.hp-=damage;
      log("The "+m.type+" hits you for "+damage+" damage!");
    } else if(dist<7 && Math.random()<0.75) {
      let sx=Math.sign(dx), sy=Math.sign(dy);
      let moves=Math.random()<0.5 ? [[sx,0],[0,sy]] : [[0,sy],[sx,0]];
      for(let [mx,my] of moves) {
        let nx=m.x+mx, ny=m.y+my;
        if(nx===player.x&&ny===player.y) break;
        if(map[ny]?.[nx]===0&&!monsterAt(nx,ny)) {
          m.x=nx;m.y=ny;break;
        }
      }
    }
  });

  if(player.hp<=0) {
    player.hp=0;
    gameOver=true;
    log("YOU HAVE PERISHED. Press R to try again.");
  }

  updateVisibility();
  updateUI();
  render();
}

function updateUI() {
  document.getElementById("hp").textContent=
    "HP: "+player.hp+" / "+player.maxHp;
  document.getElementById("level").textContent="Level: "+player.characterLevel+" | Dungeon: "+depth;
  document.getElementById("className").textContent="Class: "+CLASS_STATS[player.classId].name;
  document.getElementById("xpText").textContent="XP: "+player.xp+" / "+player.xpNeeded;
  document.getElementById("xpFill").style.width=(player.xp/player.xpNeeded*100)+"%";
  document.getElementById("skillPoints").textContent="Skill points: "+player.skillPoints;
  document.getElementById("attack").textContent="Attack: "+player.atk;
  document.getElementById("gold").textContent="Gold: "+player.gold;
  document.getElementById("potions").textContent="Potions: "+player.potions;
  document.getElementById("weapon").textContent="Weapon: "+player.weapon;
}

function render() {
  ctx.fillStyle="#09090d";
  ctx.fillRect(0,0,canvas.width,canvas.height);

  for(let y=0;y<H;y++) {
    for(let x=0;x<W;x++) {
      if(!explored[y][x]) continue;

      let v=visible[y][x];
      let tile=map[y][x];
      let px=x*TILE, py=y*TILE;

      ctx.fillStyle=v ?
        (tile===1?COLORS.wall:COLORS.floor) :
        COLORS.explored;
      ctx.fillRect(px,py,TILE,TILE);

      if(v&&tile===2) {
        drawText(">",px,py,COLORS.stairs);
      }

      if(v&&tile===1) {
        ctx.fillStyle="#706b75";
        ctx.fillRect(px+3,py+3,2,2);
      }
    }
  }

  for(let item of items) {
    if(visible[item.y]?.[item.x]) {
      let symbols={gold:"$",potion:"!",weapon:"/"};
      let colors={gold:COLORS.gold,potion:COLORS.potion,weapon:"#9c9be9"};
      drawText(symbols[item.type],item.x*TILE,item.y*TILE,colors[item.type]);
    }
  }

  for(let m of monsters) {
    if(visible[m.y]?.[m.x]) {
      drawText(m.symbol,m.x*TILE,m.y*TILE,
        m.type==="goblin"?COLORS.goblin:COLORS.orc);
    }
  }

  drawText("@",player.x*TILE,player.y*TILE,COLORS.player);

  if(gameOver) {
    ctx.fillStyle="rgba(0,0,0,0.8)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    ctx.fillStyle="#e66b6b";
    ctx.font="bold 38px Consolas";
    ctx.textAlign="center";
    ctx.fillText("YOU HAVE DIED",400,260);
    ctx.fillStyle="#ddd";
    ctx.font="18px Consolas";
    ctx.fillText("Press R to begin again",400,305);
    ctx.textAlign="left";
  }
}

function drawText(char,x,y,color) {
  ctx.fillStyle=color;
  ctx.font="bold 15px Consolas";
  ctx.textBaseline="top";
  ctx.fillText(char,x+2,y);
}

document.addEventListener("keydown",e=>{
  const k=e.key.toLowerCase();
  const keys=["arrowup","arrowdown","arrowleft","arrowright"," "];
  if(keys.includes(k)) e.preventDefault();

  if(k==="r"&&gameOver) {restart();render();return;}
  if(gameOver) return;

  const directions={
    w:[0,-1],arrowup:[0,-1],
    s:[0,1],arrowdown:[0,1],
    a:[-1,0],arrowleft:[-1,0],
    d:[1,0],arrowright:[1,0]
  };

  if(directions[k]) move(...directions[k]);
  else if(k===" ") endTurn();
  else if(k==="h") usePotion();
  else if(k==="g") pickupAction();
});

openClassModal();
