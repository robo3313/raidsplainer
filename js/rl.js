function RaidLeading (ctx, time) {
    let _myLibraryObject = {};

    //Objects set by user
    let planImage = null;
    let items = null;
    let abilities = null;
    let events = null;

    //To keep track of time
    let currentEvent = 0;
    let currentTimer = null;
    let elapsedTimer = null;
    let lastTimer = null;
    let animation = true;

    //Internal js shenanigans
    let interval = null;
    const timeConstant = time * 10;

    _myLibraryObject.setPlan = function (newPlan) {
        planImage = newPlan;
    }

    _myLibraryObject.setItems = function (newItems) {
        items = newItems;
        for (const i in items) {
            if (items[i].imageId != undefined) {
                items[i].image = document.getElementById(items[i].imageId);
            }
        }
    }

    _myLibraryObject.setAbilities = function (newAbilities) {
        abilities = newAbilities;
        for (const i in abilities) {
            abilities[i].image = document.getElementById(i);
        }
        console.log(abilities);
    }
    
    _myLibraryObject.setEvents = function (newEvents) {
        events = newEvents;
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

    function loop() {
        elapsedTimer = performance.now() - lastTimer;
        if (animation) {
            currentTimer += elapsedTimer;
        }
        lastTimer = performance.now();
        if (currentEvent >= events.length - 1) {
            clearInterval(interval);
            return ;
        }
        calcEvent(currentTimer);
        calcPositions(elapsedTimer);
        drawIcons(ctx);
    }

    function calcEvent(currentTimer) {
      const secondsSinceStart = Math.floor(currentTimer / 1000);
      document.getElementById("timer").innerHTML = secondsSinceStart;
      if (events[currentEvent].time < secondsSinceStart) {
        currentEvent += 1;
        triggerEvent(events[currentEvent]);
      }
    }

    function triggerEvent(event) {
        document.getElementById("event-title").innerHTML = event.name;
        document.getElementById("event-description").innerHTML = event.description;
        if (event.positions !== undefined) {
            for (const i in items) {
                items[i].target = event.positions[i];
            }
        }
        if (event.teleport !== undefined) {
            for (const i in items) {
                items[i].position.x = event.teleport[i].x;
                items[i].position.y = event.teleport[i].y;
            }
        }
    }

    function calcPositions(elapsedTimer) {
        elapsedTimer /= timeConstant;

        for (const i in items) {
            if (items[i].target != undefined && items[i].target !== null) {
              let d = distance(items[i].position.x, items[i].position.y, items[i].target.x, items[i].target.y);
              if (d < items[i].speed * elapsedTimer) {
                items[i].position.x = items[i].target.x;
                items[i].position.y = items[i].target.y;
                items[i].target = null;
              } else {
                items[i].position.x += items[i].speed * elapsedTimer * (items[i].target.x - items[i].position.x) / d;
                items[i].position.y += items[i].speed * elapsedTimer * (items[i].target.y - items[i].position.y) / d;
              }
            }
        }
    }

    function drawIcons(ctx) {
        ctx.drawImage(planImage, 0, 0);
        for (const i in items) {
            ctx.drawImage(items[i].image, items[i].position.x - items[i].image.width / 2, items[i].position.y - items[i].image.height / 2);
            writeText(ctx, i, items[i].position.x, items[i].position.y);
        }
        const event = events[currentEvent];
        if (event.drawings !== undefined) {
            for (const i in event.drawings) {
                const drawing = event.drawings[i];            
                if (drawing.type === "circle") {
                    const color = drawing.color !== undefined ? drawing.color : "black";
                    drawCircle(ctx, drawing.x, drawing.y, drawing.r, color);
                }
            }
        }
        if (event.abilities !== undefined) {
            for (const i in event.abilities) {            
                const ability = event.abilities[i];
                ctx.drawImage(abilities[ability.id].image, ability.x - abilities[ability.id].image.width / 2, ability.y - abilities[ability.id].image.height / 2);
                writeText(ctx, ability.name, ability.x, ability.y);
            }
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

    function drawLine(ctx, start, end) {
      ctx.moveTo(0, 0);
      ctx.lineTo(start, end);
      ctx.stroke();
    }

    function drawCircle(ctx, x, y, r, color) {
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

    return _myLibraryObject;
}
