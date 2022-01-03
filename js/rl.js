function RaidLeading (ctx, time) {
    let _myLibraryObject = {};

    //Objects set by user
    let planImage = null;
    let items = null;
    let events = null;

    //To keep track of time
    let currentEvent = 0;
    let currentTimer = null;
    let lastTimer = null;

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

    _myLibraryObject.setEvents = function (newEvents) {
        events = newEvents;
    }

    _myLibraryObject.animate = function() {
        interval = setInterval(loop, time);
    }

    function loop() {
        currentTimer = performance.now();
        const elapsedTimer = currentTimer - lastTimer;
        lastTimer = currentTimer;
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
      if (events[currentEvent].time < secondsSinceStart) {
        currentEvent += 1;
        triggerEvent(events[currentEvent]);
      }
    }

    function triggerEvent(event) {
        document.getElementById("event-title").innerHTML = event.name;
        document.getElementById("event-description").innerHTML = event.description;
        calcTargets(event);
    }


    function calcTargets(event) {
      if (event.positions !== undefined) {
        for (const i in items) {
            items[i].target = event.positions[i];
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
      if (events[currentEvent].drawings !== undefined) {
          if (events[currentEvent].drawings[0].type === "circle") {
              drawCircle(ctx, events[currentEvent].drawings[0].x, events[currentEvent].drawings[0].y, events[currentEvent].drawings[0].r);
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

    function drawCircle(ctx, x, y, r) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 2 * Math.PI);
      ctx.stroke();
    }

    function writeText(ctx, text, x, y) {
      ctx.font = "30px Arial";
      ctx.fillStyle = "white";
      ctx.textAlign = "center";
      ctx.fillText(text, x, y);
    }

    return _myLibraryObject;
}
