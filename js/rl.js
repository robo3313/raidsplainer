function RaidLeading (ctx, time) {
    let _myLibraryObject = {};

    //Objects set by user
    let planImage = null;
    let players = null;
    let abilities = null;
    let events = null;
    let phases = null;
    let currentPhase = null;

    //To keep track of time
    let currentEvent = 0;
    let currentTimer = null;
    let elapsedTimer = null;
    let lastTimer = null;
    let animation = true;
    let secondsSinceStart = Math.floor(currentTimer / 1000);
    let timeSinceLastEvent = 0;

    const warnings = [];
    const recognizedProps = ['time', 'phase', 'name', 'description', 'groups', 'players', 'drawings', 'abilities'];
    const recognizedPlayersProps = ["position", "image", "text"];
    const recognizedAbilitiesProps = ["id", "name", "position"];

    //Internal js shenanigans
    let interval = null;
    const timeConstant = time * 10;

    _myLibraryObject.setPlan = function (newPlan) {
        planImage = newPlan;
    }

    _myLibraryObject.setPlayers = function (newPlayers) {
        players = newPlayers;
        for (const i in players) {
            if (players[i].imageId != undefined) {
                players[i].image = document.getElementById(players[i].imageId);
            }
        }
    }

    _myLibraryObject.setAbilities = function (newAbilities) {
        abilities = newAbilities;
        for (const i in abilities) {
            abilities[i].image = document.getElementById(i);
        }
    }
    
    _myLibraryObject.setEvents = function (newEvents) {
        events = newEvents;
        for (const i in events) {
            if (events[i].phase !== undefined) {
                phases[events[i].phase].events.push(i);
            }
            checkEvent(events[i]);
        }
        console.log(warnings);
    }

    _myLibraryObject.setPhases = function (newPhases) {
        phases = newPhases;
    }

    _myLibraryObject.start = function() {
        interval = setInterval(loop, time);
    }

    _myLibraryObject.pause = function() {
        animation = false;
    }

    _myLibraryObject.resume = function() {
        lastTimer = performance.now();
        animation = true;
    }

    _myLibraryObject.goToEvent = function(newCurrentEvent) {
        timeSinceLastEvent = 0;
        currentEvent = newCurrentEvent;
        triggerEvent(events[currentEvent]);
    }

    function loop() {
        elapsedTimer = performance.now() - lastTimer;
        if (animation) {
            currentTimer += elapsedTimer;
            timeSinceLastEvent += elapsedTimer;
        }
        lastTimer = performance.now();
        /*if (currentEvent >= events.length - 1) {
            clearInterval(interval);
            return ;
        }*/
        calcEvent(currentTimer);
        calcPositions(elapsedTimer);
        drawIcons(ctx);
    }

    function calcEvent(currentTimer) {
        secondsSinceStart = Math.floor(currentTimer / 1000);
        document.getElementById("timer").innerHTML = secondsSinceStart;
        if (timeSinceLastEvent / 1000 > events[currentEvent].time && currentEvent < events.length - 1) {
            timeSinceLastEvent = 0;
            currentEvent += 1;
            triggerEvent(events[currentEvent]);
        }
    }

    function triggerEvent(event) {
        document.getElementById("event-title").innerHTML = event.name;
        document.getElementById("event-description").innerHTML = event.description;
        if (event.groups !== undefined) {
            for (const k in event.groups) {
                const groupEvent = event.groups[k];
                for (const i in players) {
                    if (players[i].groups.includes(k)) {
                        if (groupEvent.position !== undefined) {
                            if (typeof groupEvent.position == "string") {
                                players[i].target = players[i].positions[groupEvent.position];
                            } else {
                                players[i].target = groupEvent.position;
                            }
                        }
                        if (groupEvent.teleport !== undefined) {
                            players[i].x = groupEvent.teleport.x;
                            players[i].y = groupEvent.teleport.y;
                        }                        
                    }
                }
            }
        }

        if (event.players !== undefined) {
            for (const i in event.players) {
                const playerEvent = event.players[i];
                if (playerEvent.position !== undefined) {
                    if (typeof playerEvent.position == "string") {
                        players[i].target = players[i].positions[playerEvent.position];
                    } else {
                        players[i].target = playerEvent.position;
                    }
                }
                if (event.teleport !== undefined) {
                    players[i].x = playerEvent.teleport[i].x;
                    players[i].y = playerEvent.teleport[i].y;
                }
            }
        }
        displayPhase();
        displayTimeline();
    }

    function displayPhase() {
        currentPhase = events[currentEvent].phase !== undefined ?  events[currentEvent].phase : '';
        document.getElementById("phase").innerHTML = phases[currentPhase].name+' ('+currentEvent+')';
    }

    function displayTimeline() {
        const timelineDiv = document.getElementById("timeline");
        timelineDiv.innerHTML = '';
        let lastEvent = null;
        let tmpEvent = null;
        for (const i in phases[currentPhase].events) {
            const event = phases[currentPhase].events[i]
            const div = document.createElement('span');
            tmpEvent = events[event].name.split(" ")[0];
            if (lastEvent != tmpEvent) {
                lastEvent = tmpEvent;
                div.innerHTML = lastEvent;
                if (lastEvent === events[currentEvent].name.split(" ")[0]) {
                    div.className = 'event selected';
                } else {
                    div.className = 'event';
                }
                div.setAttribute("onclick", "rl.goToEvent("+event+");");
                timelineDiv.appendChild(div);    
            }
        }
    }

    function calcPositions(elapsedTimer) {
        elapsedTimer /= timeConstant;
        for (const i in players) {
            if (players[i].target != undefined && players[i].target !== null) {
              let d = distance(players[i].x, players[i].y, players[i].target.x, players[i].target.y);
              if (d < players[i].speed * elapsedTimer) {
                players[i].x = players[i].target.x;
                players[i].y = players[i].target.y;
                players[i].target = null;
              } else {
                players[i].x += players[i].speed * elapsedTimer * (players[i].target.x - players[i].x) / d;
                players[i].y += players[i].speed * elapsedTimer * (players[i].target.y - players[i].y) / d;
              }
            }
        }
    }

    function drawIcons(ctx) {
        ctx.drawImage(planImage, 0, 0);
        const event = events[currentEvent];
        if (event.drawings !== undefined) {
            for (const i in event.drawings) {
                const drawing = event.drawings[i];
                const color = drawing.color !== undefined ? drawing.color : "black";
                if (drawing.type === "disc") {
                    drawDisc(ctx, drawing.x, drawing.y, drawing.r, color);
                } else if (drawing.type === "circle") {
                    drawCircle(ctx, drawing.x, drawing.y, drawing.r, color);
                } else if (drawing.type === "line") {
                    drawLine(ctx, drawing.x1, drawing.y1, drawing.x2, drawing.y2, color);
                }
            }
        }
        if (event.abilities !== undefined) {
            for (const i in event.abilities) {            
                const ability = event.abilities[i];
                ctx.drawImage(abilities[ability.id].image, ability.position.x - abilities[ability.id].image.width / 2, ability.position.y - abilities[ability.id].image.height / 2);
                writeText(ctx, ability.name, ability.position.x, ability.position.y + abilities[ability.id].image.height / 2);
            }
        }
        let image;
        let text;
        for (const i in players) {
            if (event.players !== undefined && event.players[i] !== undefined && event.players[i].image !== undefined) {
                image = abilities[event.players[i].image].image;
            } else {
                image = players[i].image;
            }
            if (event.players !== undefined && event.players[i] !== undefined && event.players[i].text !== undefined) {
                text = event.players[i].text;
            } else {
                text = players[i].name.substring(0, 5);
            }
            ctx.drawImage(image, players[i].x - players[i].image.width / 2, players[i].y - players[i].image.height / 2);
            writeText(ctx, text, players[i].x, players[i].y);
        }
    }

    function distance(startX, startY, endX, endY) {
      const dx = endX - startX;
      const dy = endY - startY;
      return Math.sqrt(dx * dx + dy * dy)
    }

    function drawRectangle(ctx, x, y, length, height) {
      ctx.fillStyle = "#FF0000";
      ctx.fillRect(x, y, length, height);
    }

    function drawLine(ctx, x1, y1, x2, y2, color) {
        ctx.strokeStyle = color;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }

    function drawCircle(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color; 
        ctx.stroke();
    }

    function drawDisc(ctx, x, y, r, color) {
        ctx.beginPath();
        ctx.arc(x, y, r, 0, 2 * Math.PI);
        ctx.fillStyle = color; 
        ctx.fill();
        ctx.stroke();
    }

      function drawGradiant(x, y, r, x1, y1, r1) {
        // Create gradient
        var grd = ctx.createRadialGradient(75,50,5,90,60,100);
        grd.addColorStop(0,"black");
        grd.addColorStop(1,"white");

        // Fill with gradient
        ctx.fillStyle = grd;
        ctx.fillRect(10,10,150,150);
    }

    function writeText(ctx, text, x, y) {
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(text, x, y);
    }

    function checkEvent(event) {
        for (const prop in event) {
            if (!recognizedProps.includes(prop)) {
                warnings.push('Unrecognized prop : '+prop+' in event :'+event.name);
            }
            for (const i in event[prop]) {
                if (prop === "players") {
                    checkPlayerProps(event[prop][i], event);
                } else if (prop === "abilities") {
                    checkAbilitiesProps(event[prop][i], event);
                } else if (prop === "drawings") {
                    checkDrawingsProps(event[prop][i], event);
                }
            }
        }
    }

    function checkPlayerProps(player, event) {
        if (player.position !== undefined) {
            checkPositionProp(player.position, event, "players");
        }
        if (player.position !== undefined) {
            checkPositionProp(player.position, event, "players");
        }
    }

    function checkAbilitiesProps(ability, event) {
        if (ability.id === undefined) {
            warnings.push('Missing property "id" for ability in event : '+event.name);
        }
        if (ability.name === undefined) {
            warnings.push('Missing property "name" for ability in event : '+event.name);
        }
        if (ability.name === undefined) {
            warnings.push('Missing property "positio"n for ability in event : '+event.name);
        }
        //checkPositionProp(ability.position, event, "abilities");
    }

    function checkDrawingsProps(drawing, event) {
        if (drawing.type === undefined) {
            warnings.push('Missing property "type" for drawing in event : '+event.name);
        }
        /*if (drawing.position === undefined) {
            warnings.push('Missing property "position" for drawing in event : '+event.name);
        }*/
        /*if (drawing.position !== undefined) {
            checkPositionProp(drawing.position, event, "drawings");
        }*/
    }

    function checkPositionProp(prop, event, tag) {
        if ((prop['x'] === undefined || prop['y'] === undefined) && typeof prop !== "string") {
            warnings.push('Wrong position for property : '+tag+' in event :'+event.name);
        }
    }

    return _myLibraryObject;
}
