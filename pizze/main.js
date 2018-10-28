(async function () {
    "use strict";
    const response = await fetch("data.json");
    const data = await response.json();

    window.data = data;

    const canonicalNames = {};
    data.synonyms.forEach(synList => {
        const first = synList[0];
        for (let i = 1; i < synList.length; i++) {
            canonicalNames[synList[i]] = first;
        }
    });

    // tags
    const sheet = document.styleSheets[0];
    data.tagDefs.forEach(tagDef => {
        const tag = tagDef.tag;
        const color = tagDef.fg ? `color: ${tagDef.fg}; ` : "";
        sheet.insertRule(`.tag.${tag} { background-color: ${tagDef.bg}; ${color}}`);
        sheet.insertRule(`.tag.${tag}::before { content: "${tagDef.icon}"; }`);
        sheet.insertRule(`body.not-${tag} .topping.${tag}, body[data-filter=${tag}] .topping:not(.${tag}) { display: none }`);
        sheet.insertRule(`body[data-filter=${tag}] .tag.${tag} { box-shadow: inset black 1px 1px 1px }`);
        sheet.insertRule(`body.not-${tag} .tag.${tag} { opacity: 0.5; box-shadow: none; }`);

        const elem = document.createElement("span");
        elem.classList.add("tag");
        elem.classList.add(tag);
        elem.dataset.tag = tag;
        elem.textContent = tag + " ";

        const remove = document.createElement("span");
        remove.textContent = "❌";
        remove.addEventListener("click", ev => {
            if (document.body.classList.toggle("not-" + tag) && document.body.dataset.filter === tag) {
                delete document.body.dataset.filter;
            }
            ev.stopPropagation();
        });
        elem.appendChild(remove);

        filtersContainer.appendChild(elem);
    });

    // restaurants
    const allRestaurants = Object.values(data.restaurants).sort((a, b) => a.name.localeCompare(b.name));
    allRestaurants.forEach((res, i) => {
        sheet.insertRule(`body[data-res-col="${i}"]:not(.no-res-${i}) .res-box.index-${i} { background: #aaa; }`);
        sheet.insertRule(`body[data-res-col="${i}"]:not(.no-res-${i}) .res-box.available.index-${i} { background: #1a1; }`);
        sheet.insertRule(`body[data-res-col="${i}"]:not(.no-res-${i}) #resNames > .res-${i} { display: inline-block; }`);
        sheet.insertRule(`body.no-res-${i} .res-box.index-${i} { background: #f8f8f8; }`);
        sheet.insertRule(`body.no-res-${i} .res-box.available.index-${i} { background: #d4f7d4; }`);
        sheet.insertRule(`body.res-${i} .topping.res-${i} label { color: black; }`);

        document.body.classList.add("res-" + i);

        const resBox = document.createElement("div");
        resBox.className = "res-box available";
        resBox.innerHTML = "&nbsp;";
        resBox.dataset.index = i;
        resBox.classList.add("index-" + i);
        resHeaders.appendChild(resBox);

        const resName = document.createElement("div");
        resName.textContent = " " + res.name;
        resName.classList = "res-" + i;
        resNames.appendChild(resName);
    });

    function handleResHover(elem) {
        elem.addEventListener("mouseover", ev => document.body.dataset.resCol = ev.target.dataset.index, true);
        elem.addEventListener("mouseout", () => delete document.body.dataset.resCol, true);
    }
    handleResHover(resHeaders);

    // process topping data
    const allToppings = [];
    const toppingsByKey = {};
    allRestaurants.forEach(res => {
        res.toppings.forEach(name => {
            // ensure name has first char uppercase
            name = name.replace(/^([a-z])/, m => m.toUpperCase());
            // key is lowercase without numbers or punctuation
            let key = name.toLowerCase()
                .replace(/[^a-zäö]|(?:^(?:tuore|tupla|vihreä) *)/g, "");
            const canonical = canonicalNames[key];
            key = canonical || key;
            let topping = toppingsByKey[key];
            if (!topping) {
                topping = {
                    key,
                    // if canonical exists then name is not primary
                    name: !canonical ? name : null,
                    names: [name],
                    tags: data.tags[key],
                    byRestaurant: { [res.id]: [name] },
                    restaurants: [res.id]
                };
                toppingsByKey[key] = topping;
                allToppings.push(topping);
            } else {
                topping.restaurants.push(res.id);
                if (topping.byRestaurant[res.id])
                    topping.byRestaurant[res.id].push(name);
                else
                    topping.byRestaurant[res.id] = [name];
                if (topping.names.indexOf(name) === -1)
                    topping.names.push(name);
                if (!canonical && !topping.name)
                    topping.name = name;
            }
        });
    });

    // create topping elements
    allToppings.forEach(topping => {
        topping.names.sort((a, b) => {
            if (a === topping.name)
                return -1;
            if (b === topping.name)
                return 1;
            return a.localeCompare(b);
        });
    });
    allToppings.sort((a, b) => a.names[0].localeCompare(b.names[0]));
    allToppings.forEach(topping => {
        const li = document.createElement("div");
        li.className = "topping";
        li.dataset.key = topping.key;

        const resContainer = document.createElement("div");
        handleResHover(resContainer);
        resContainer.className = "res-container";
        li.appendChild(resContainer);
        allRestaurants.forEach((res, i) => {
            const resBox = document.createElement("div");
            resBox.className = "res-box";
            if (topping.restaurants.includes(res.id)) {
                resBox.classList.add("available");
                li.classList.add("res-" + i);
            }
            resBox.innerHTML = "&nbsp;";
            resBox.dataset.index = i;
            resBox.classList.add("index-" + i);
            resContainer.appendChild(resBox);
        });

        const check = document.createElement("input");
        check.type = "checkbox";

        const name = document.createElement("label");
        name.appendChild(check);
        name.appendChild(document.createTextNode(" " + topping.names[0]));
        li.appendChild(name);

        if (topping.tags) {
            topping.tags.forEach(t => {
                li.classList.add(t);

                const tag = document.createElement("span");
                tag.classList.add("tag");
                tag.classList.add(t);
                tag.dataset.tag = t;
                tag.type = "text";
                tag.textContent = t;
                li.appendChild(tag);
            });
        }

        if (topping.names.length > 1) {
            const otherNames = document.createElement("span");
            otherNames.className = "other-names";
            otherNames.textContent = " | " + topping.names.slice(1).join(" | ");
            li.appendChild(otherNames);
        }

        toppingsContainer.appendChild(li);
    });

    function updateSummary() {
        const selected = [].map.call(toppingsContainer.querySelectorAll(":checked"),
            ch => toppingsByKey[ch.parentElement.parentElement.dataset.key]);
        const restaurants = allRestaurants.filter((res, i) => {
                const has = selected.every(t => t.restaurants.includes(res.id));
                document.body.classList.toggle("res-" + i, has);
                document.body.classList.toggle("no-res-" + i, !has);
                return has;
            });

        // clear and fill summary table
        while (summaryHeader.firstChild) {
            summaryHeader.removeChild(summaryHeader.firstChild);
        }
        while (summaryFooter.firstChild) {
            summaryFooter.removeChild(summaryFooter.firstChild);
        }
        while (summaryTable.firstChild) {
            summaryTable.removeChild(summaryTable.firstChild);
        }

        const showSummary = selected.length > 0 && restaurants.length > 0;
        summaryContainer.style.display = showSummary ? "" : "none";

        if (!showSummary)
            return;

        const summaryColumns = restaurants.map(r => {
            let bestPrice = null;
            r.prices.some(p => {
                if (selected.length > p.toppingCount)
                    return false;

                bestPrice = p;
                return true;
            });
            let over = false;
            if (bestPrice === null) {
                bestPrice = r.prices[r.prices.length - 1];
                over = true;
            }
            return {
                restaurant: r,
                bestPrice: bestPrice,
                cheapest: +bestPrice.sizes[0].price,
                over: over
            };
        }).sort((a, b) => a.over - b.over || a.cheapest - b.cheapest);

        // empty cell for remove icons
        summaryHeader.appendChild(document.createElement("td"));
        summaryFooter.appendChild(document.createElement("td"));

        // header cells
        summaryColumns.forEach(sum => {
            const td = document.createElement("td");
            const a = document.createElement("a");
            a.textContent = sum.restaurant.name;
            a.href = sum.restaurant.url;
            a.target = "_blank";
            td.appendChild(a);
            summaryHeader.appendChild(td);
        });

        // footer cells
        summaryColumns.forEach(sum => {
            const td = document.createElement("td");

            const countElem = document.createElement("div");
            countElem.className = "summary-count";
            if (sum.over) {
                countElem.classList.add("over");
                countElem.textContent = `Max ${sum.bestPrice.toppingCount} toppings`;
            } else {
                countElem.textContent = sum.bestPrice.toppingCount + " toppings:";
            }
            td.appendChild(countElem);

            if (!sum.over) {
                sum.bestPrice.sizes.forEach(s => {
                    const priceElem = document.createElement("div");
                    priceElem.textContent = s.name + " €" + s.price;
                    td.appendChild(priceElem);
                });
            }

            summaryFooter.appendChild(td);
        });

        // data cells
        selected.forEach(t => {
            const tr = document.createElement("tr");

            const rem = document.createElement("td");
            rem.textContent = "❌";
            rem.addEventListener("click", () => {
                const check = toppingsContainer.querySelector(".topping[data-key=" + t.key + "] input");
                check.checked = false;
                check.dispatchEvent(new Event("change", { bubbles: true }));
            });
            tr.appendChild(rem);

            summaryColumns.forEach(sum => {
                const td = document.createElement("td");
                const resId = sum.restaurant.id;
                if (t.byRestaurant[resId])
                    t.byRestaurant[resId].forEach(t => {
                        const div = document.createElement("div");
                        div.textContent = t;
                        td.appendChild(div);
                    });
                tr.appendChild(td);
            });

            summaryTable.appendChild(tr);
        });
    }

    updateSummary();

    // click on tags
    document.addEventListener("click", ev => {
        const tag = ev.target.dataset.tag;
        if (tag) {
            if (document.body.dataset.filter === tag) {
                delete document.body.dataset.filter;
            } else {
                document.body.dataset.filter = tag;
                document.body.classList.remove("not-" + tag);
            }
        }
    });

    // enable/disable toppings
    document.addEventListener("change", updateSummary);
})();
