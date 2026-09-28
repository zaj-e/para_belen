export const WORLD={width:960,height:640,floor:492};
export const platforms=[{id:'sofa',x:104,y:400,w:270},{id:'stool',x:417,y:404,w:118},{id:'table',x:631,y:334,w:263}];
export function createCat(){return {x:140,y:WORLD.floor,vx:0,vy:0,facing:1,grounded:true,surface:'floor',coyote:.1,jumpBuffer:0,landTime:0,walkTime:0}}
export function stepCat(cat,input,dt){dt=Math.min(dt,.025);const previousY=cat.y;cat.landTime=Math.max(0,cat.landTime-dt);cat.coyote=cat.grounded?.1:Math.max(0,cat.coyote-dt);cat.jumpBuffer=input.jump?.12:Math.max(0,cat.jumpBuffer-dt);cat.vx=(Number(!!input.right)-Number(!!input.left))*190;if(cat.vx)cat.facing=Math.sign(cat.vx);if(cat.jumpBuffer>0&&cat.coyote>0){cat.vy=-560;cat.grounded=false;cat.surface=null;cat.coyote=0;cat.jumpBuffer=0;cat.landTime=0}cat.vy+=1350*dt;cat.x=Math.max(30,Math.min(930,cat.x+cat.vx*dt));cat.y+=cat.vy*dt;cat.grounded=false;cat.surface=null;const surfaces=[...platforms,{id:'floor',x:0,w:960,y:WORLD.floor}].sort((a,b)=>a.y-b.y);for(const p of surfaces){if(cat.vy>=0&&previousY<=p.y+1&&cat.y>=p.y&&cat.x+15>p.x&&cat.x-15<p.x+p.w){if(cat.vy>200)cat.landTime=.14;cat.y=p.y;cat.vy=0;cat.grounded=true;cat.surface=p.id;break}}if(cat.grounded&&cat.vx)cat.walkTime+=dt;return cat}
export function canRead(cat){return cat.surface==='table'&&Math.abs(cat.x-746)<90}

export function createCompanion(leader) {
    return { ...createCat(), x: Math.max(30, Math.min(930, leader.x - leader.facing * 78)), facing: leader.facing };
}

export function stepCompanion(companion, leader, dt, jump = false) {
    dt = Math.max(0, Math.min(dt, .025));
    const distance = leader.x - companion.x;
    // Wait if Belén is walking toward Marcelo; never run away in front of her.
    const ahead = leader.vx * distance < 0;
    const travel = ahead ? 0 : Math.min(205 * dt, Math.max(0, Math.abs(distance) - 78));
    companion.x = Math.max(30, Math.min(930, companion.x + Math.sign(distance) * travel));
    companion.vx = dt > 0 && travel > 0 ? Math.sign(distance) * travel / dt : 0;
    if (distance) companion.facing = Math.sign(distance);
    companion.landTime = Math.max(0, companion.landTime - dt);
    if (jump && companion.grounded) {
        companion.vy = -560;
        companion.grounded = false;
        companion.surface = null;
        companion.landTime = 0;
    }
    if (!companion.grounded) {
        companion.vy += 1350 * dt;
        companion.y += companion.vy * dt;
        // Marcelo can hop with Belén, but always lands on the floor, not furniture.
        if (companion.y >= WORLD.floor) {
            companion.y = WORLD.floor;
            companion.vy = 0;
            companion.grounded = true;
            companion.surface = 'floor';
            companion.landTime = .14;
        }
    }
    if (travel && companion.grounded) companion.walkTime += dt;
    return companion;
}
