function el(str) {
    let dom_el;
    if(str.includes(".")) {
        const split_str = str.split(".");
        const class_names = split_str[1].split(",");
        dom_el = document.createElement(split_str[0]);
        for(let i = 0; i<class_names.length; i++) dom_el.classList.add(class_names[i]);
    } else {
        dom_el = document.createElement(str);
    }
    
    return dom_el;
}

function $(str) {return document.querySelector(str)}

const tiles_container = $(".tiles");
const gamemodes = [
    {
        gamemode: "Easy",
        grid_size: 4,
        gap: 5,
        is_colours: 1,
        is_rotation: 0,
        avg_playtime: "1",
        hue: 95,
    },
    {
        gamemode: "Medium",
        grid_size: 4,
        gap: 5,
        is_colours: 0,
        is_rotation: 0,
        avg_playtime: "2-3",
        hue: 25,
    },
    {
        gamemode: "Hard",
        grid_size: 6,
        gap: 3,
        is_colours: 1,
        is_rotation: 0,
        avg_playtime: "4-5",
        hue: -55,
    },
    {
        gamemode: "Extra Hard",
        grid_size: 6,
        gap: 3,
        is_colours: 1,
        is_rotation: 1,
        avg_playtime: "8-10",
        hue: -105,
    },
    {
        gamemode: "Impossible",
        grid_size: 6,
        gap: 3,
        is_colours: 0,
        is_rotation: 1,
        avg_playtime: ">10",
        hue: -105,
    },
]

const info_formatters = {
    grid_size: value => `${value * value / 2} Pairs`,
    is_colours: value => value ? "Colourful Tiles" : "No Colours",
    is_rotation: value => value
        ? "Tiles are randomly rotated"
        : "All tiles are the same way up",
        avg_playtime: value =>
        `Average playtime of ${value} minute${value === "1" ? "" : "s"}`
};

const gamemodes_container = $(".difficulties");
const info = $(".info");
const testing = false;
const grid_gap = tiles_container.getAttribute("data-grid-gap");
const image_src = tiles_container.getAttribute("data-src");
const thumb_track = $(".slider > .thumb-track");
const slider = thumb_track.parentElement;
const start_game_button = $(".start-game")
const info_padding = 10;
const menu_dialog = $("dialog.menu")
const end_game = $(".end-game");
const reveal_btn = $(".reveal-btn");
const card_wrapper = $(".card.wrapper");

$(".card.wrapper").style.setProperty("--bg-image", `url(${image_src})`);

generate_gamemode_info();

const gamemode_spans = document.querySelectorAll(".difficulties > span");

async function get_data(link, API_KEY = "AIzaSyAYlUEDXUhh4W-8heoe6cgXwrI2n83Xggc") {
    if (!API_KEY) {
        throw new Error("API_KEY is required");
    }

    const spreadsheet_id_match = link.match(/\/d\/([a-zA-Z0-9-_]+)/);

    if (!spreadsheet_id_match) {
        throw new Error("Invalid Google Sheets link");
    }

    const spreadsheet_id = spreadsheet_id_match[1];

    const endpoint =
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheet_id}/values:batchGet` +
        `?ranges=A:ZZZ&majorDimension=ROWS&key=${API_KEY}`;

    const response = await fetch(endpoint);

    if (!response.ok) {
        throw new Error(`Google Sheets API error: ${response.status}`);
    }

    const data = await response.json();
    const rows = data.valueRanges?.[0]?.values ?? [];

    if (rows.length === 0) return [];

    const headers = rows[0].map(h =>
        h
            .toString()
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_")
    );

    return rows.slice(1).map(row => {
        const obj = {};
        headers.forEach((key, i) => {
            obj[key] = row[i] ?? "";
        });
        return obj;
    });
}

function generate_gamemode_info() {
    gamemodes.forEach(function(gamemode, index) {
        const span = el("span");
        span.textContent = gamemode.gamemode;
        gamemodes_container.appendChild(span);
        
        const list = el(`ul.${gamemode.gamemode.replace(" ", "-").toLowerCase()}`);
        
        Object.entries(info_formatters).forEach(function([key, formatter]) {
            const list_item = el("li");
            list_item.textContent = formatter(gamemode[key]);
            list.appendChild(list_item);
        });
        
        info.appendChild(list);

        if(index === 0) {
            activate(span)
            info.style.setProperty("--info-height", list.offsetHeight + info_padding + "px");
        }

        list.style.setProperty("--initial-rotation", "-90deg");
    });
    
    activate(info.children[0]);
}

function shuffle(array) {
    // The de-facto unbiased shuffle algorithm is the Fisher–Yates (aka Knuth) Shuffle.
    // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
    let currentIndex = array.length;

    // While there remain elements to shuffle...
    while (currentIndex != 0) {

        // Pick a remaining element...
        let randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
}

function generate_tiles(grid_size, tiles, testing) {
    tiles_container.style.setProperty("--tile-image", `url(${image_src})`);
    tiles.forEach(function(val, index) {
        const tile = el("div.tile");
        const tile_inner = el("div.tile-inner");
        if(index % grid_size >= grid_size / 2) tile.classList.add("reversed");
        if(testing) {
            let str = val;
            tile.textContent = str;
        } 
        tile.style.display = "none";
        tile.appendChild(tile_inner);
        tiles_container.appendChild(tile);
    })

    const fullscreen_image = el("div.fullscreen-image");
    for(let i = 0; i<2; i++) fullscreen_image.appendChild(el(`div.${i+1}`))
    tiles_container.appendChild(fullscreen_image);
}

function get_mirrored_val(i, grid_size) {
    let row = Math.floor(i / grid_size);
    let col = i % grid_size;
    let mirror_col = Math.min(col, grid_size - 1 - col);
    let half_width = Math.ceil(grid_size / 2);
    let val = row * half_width + mirror_col + 1;
    return val;
}

function mirrored_arr(grid_size) {
    let tiles = [];
    for (let i = 0; i < grid_size ** 2; i++) {
        tiles.push(get_mirrored_val(i, grid_size));
    }
    return tiles;
}

async function reveal_tiles(grid_size, tiles, difficulty) {
    return display_tiles(
        grid_size,
        Array.from(tiles.keys()),
        difficulty,
        tiles,
        true
    );
}

function tile_transforms(tile, pos, tile_size, container_width, offset_pos) {
    tile.style.left = `${pos.left}px`;
    tile.style.top = `${pos.top}px`;
    tile.style.width = `${tile_size}px`;
    tile.style.height = `${tile_size}px`;
    tile.style.setProperty("--image-size", `${container_width / 2}px ${container_width}px`); // Image width is contains left half of image
    tile.style.setProperty("--tile-offset", `${-offset_pos.left}px ${-offset_pos.top}px`); // 2px offset due to bottom of image repeating at top
}

function calculate_grid_pos(grid_size, image_based, index, tile_order, parsed_gap, tiles, tile_size) {
    let row; let col;

    if(image_based) {
        let mirrored_index = tiles[index] - 1;
        row = Math.floor(index / grid_size);
        col = mirrored_index % grid_size;
    } else {
        row = Math.floor(tile_order[index] / grid_size);
        col = tile_order[index] % grid_size;
    }
    
    const left = (col * tile_size) + (col * parsed_gap);
    const top = (row * tile_size) + (row * parsed_gap);

    return {left, top}
}

async function display_tiles(grid_size, tile_order, difficulty, tile_arr, reveal=false) {
    const tiles = document.querySelectorAll(".tiles > .tile");
    let parsed_gap = grid_gap !== "" ? grid_gap : difficulty.gap;
    if(reveal) parsed_gap = 0

    const container_width = tiles_container.offsetWidth;
    const total_gap_width = parsed_gap * (grid_size - 1);
    const tile_size = (container_width - total_gap_width) / grid_size;

    return new Promise((resolve) => {
        tiles.forEach(function(tile, index) {
            const pos = calculate_grid_pos(grid_size, image_based = false, index, tile_order, parsed_gap, tile_arr, tile_size);
            const offset_pos = calculate_grid_pos(grid_size, image_based = true, index, tile_order, parsed_gap, tile_arr, tile_size);
            tile.style.setProperty("--transform-origin", `${container_width / 2}px ${container_width / 2}px center`);
            tile.style.zIndex = grid_size**2 - tile_order[index];
            if(!reveal) {
                tile.style.setProperty("--rotation", Math.floor(Math.random() * 4) * 90 * difficulty.is_rotation + "deg"); // random rotation, chooses between 0, 90, 180, 270;
                tile.style.setProperty("--bg-colour", `hsl(${difficulty.is_colours * (360 / (grid_size**2 / 2) * tile_arr[index])}deg ${30 * difficulty.is_colours}% ${40 * difficulty.is_colours}%)`);
                tile_transforms(tile, pos, tile_size, container_width, offset_pos);
                tile.style.display = "initial";
                resolve("Initialisation Complete")
            } else {
                setTimeout(() => {
                    let transition_time = 3;
                    tile_transforms(tile, pos, tile_size, container_width, offset_pos);
                    if(index === 0) $(".game-container").style.setProperty("--transition-time", `${transition_time}s`);
                    tile.style.setProperty("--transition-time", `${transition_time}s`);
                    tile.style.setProperty("--rotation", "0deg");
                    tile.style.setProperty("--bg-colour", "hsl(0deg 0% 0%)");
                    tile.classList.add("reveal")
                    if(index === tiles.length - 1) {
                        setTimeout(() => {
                            resolve("Reveal Animation Complete")
                        }, transition_time * 1000);
                    }
                }, index * 100);
            }
        });
    })
}

function activate(el) {
    const elements = el.length ? el : [el];

    elements.forEach(sub_el => {
        if (!sub_el.classList.contains("active")) {
            sub_el.classList.add("active");
        }
    });
}

function deactivate(el) {
    const elements = el.length ? el : [el];

    elements.forEach(sub_el => {
        if (sub_el.classList.contains("active")) {
            sub_el.classList.remove("active");
            sub_el.classList.add("deactivating");
            setTimeout(() => {
                sub_el.classList.remove("deactivating");
            }, 500);
        }
    });
}

async function starting_menu() {
    return new Promise((resolve) => {
        const original_colour = getComputedStyle(thumb_track).backgroundColor;

        const margin = 20;
        const steps = gamemodes.length - 1;

        let previous_gamemode = gamemode_spans[0];
        let difficulty = gamemodes[0];
        let is_dragging = false;

        function get_slider_state(client_x) {
            const rect = slider.getBoundingClientRect();

            const left = rect.left + margin;
            const right = rect.right - margin;
            const width = right - left;

            const x = Math.min(Math.max(client_x, left), right);
            const t = (x - left) / width;
            const step_index = Math.round(t * steps);

            return { x, t, step_index, width, left };
        }

        function update_slider(client_x, snap = false) {
            const { x, step_index, width, left } = get_slider_state(client_x);
            difficulty = gamemodes[step_index];

            if (gamemode_spans[step_index] !== previous_gamemode) {
                const current_gamemode = gamemode_spans[step_index];

                deactivate($(`.info > ul.${previous_gamemode.textContent.replace(" ", "-").toLowerCase()}`));
                deactivate(previous_gamemode);

                activate(current_gamemode);
                activate($(`.info > ul.${current_gamemode.textContent.replace(" ", "-").toLowerCase()}`));

                previous_gamemode = current_gamemode;

                thumb_track.style.filter = `hue-rotate(${difficulty.hue}deg)`;
                thumb_track.style.background =
                    step_index === gamemode_spans.length - 1
                        ? "rgb(0,0,0)"
                        : original_colour;
            }

            const visual_x = snap
                ? (step_index / steps) * width + margin
                : x - left + margin;

            thumb_track.style.left = `${visual_x}px`;
        }

        /* =======================
           Pointer / Mouse handling
        ======================== */

        thumb_track.addEventListener("pointerdown", (e) => {
            is_dragging = true;
            thumb_track.setPointerCapture(e.pointerId);
            update_slider(e.clientX);
        });

        thumb_track.addEventListener("pointermove", (e) => {
            if (!is_dragging) return;
            update_slider(e.clientX);
        });

        thumb_track.addEventListener("pointerup", (e) => {
            is_dragging = false;
            update_slider(e.clientX, true);
        });

        thumb_track.addEventListener("pointerleave", (e) => {
            if (!is_dragging) return;
            is_dragging = false;
            update_slider(e.clientX, true);
        });

        start_game_button.addEventListener("click", () => {
            resolve(difficulty);
        });
    });
}

async function start_game(grid_size, obj) {
    return new Promise((resolve) => {
        let pairs_flipped = [];
        let currently_flipped = [];
        let is_interactive = true;
        const tiles = document.querySelectorAll(".tiles > .tile");
        const tiles_arr = Array.from(tiles)
        tiles_container.addEventListener("click", (e) => {
            if(is_interactive && e.target.classList.contains("tile-inner")) {
                console.log(e.target)
                let current_tile = e.target.closest(".tile");
                let val = tiles_arr.indexOf(current_tile);
                let mirrored_index = get_mirrored_val(val, grid_size);

                if(currently_flipped.length < 2 && !pairs_flipped.includes(mirrored_index)) {
                    currently_flipped.push(val); 
                    activate(current_tile)
                }

                if(currently_flipped.length === 2) {
                    const mirrored_arr = [
                        get_mirrored_val(currently_flipped[0], grid_size),
                        get_mirrored_val(currently_flipped[1], grid_size)
                    ];
                    if(mirrored_arr[0] === mirrored_arr[1]) {
                        pairs_flipped.push(mirrored_arr[0]);
                        currently_flipped = [];
                        if(pairs_flipped.length === (grid_size**2 / 2)) {
                            resolve({"success": true, "difficulty": obj.difficulty});
                        }
                    } else {
                        is_interactive = false;
                        setTimeout(() => {
                            deactivate([
                                tiles[currently_flipped[0]],
                                tiles[currently_flipped[1]]
                            ])
                            currently_flipped = [];
                            is_interactive = true;
                        }, 1000);
                    }
                }
            } else {
                e.preventDefault();
            }
        })
        $(".give-up").onclick = () => {
            resolve({"success": false, "difficulty": obj.difficulty})
        }
    })
}

function reveal_remaining() {
    const tiles = document.querySelectorAll(".tiles > .tile");
    tiles.forEach(tile => {
        if(!tile.classList.contains("active")) activate(tile)
    })
}

function end_game_logic(grid_size, tiles, obj, res) {
    end_game.showModal();
    reveal_btn.onclick = () => {
        end_game.close();
        reveal_remaining();
        setTimeout(() => {
            reveal_tiles(grid_size, tiles, obj)
            .then(() => {
                activate($(".fullscreen-image"));
                setTimeout(() => {
                    activate($(".send-message"));
                    const msg_text = encodeURIComponent(`I ${res.success ? "completed": "attempted"} the ${obj.gamemode} Level on the Maori Memory Game!`);
                    $("a.send-message-btn").href = `whatsapp://send?text=${msg_text}`;
                }, 2000);
            })
        }, 1000);
    };
}

function encourage() {
    $(".end-game > h2").textContent = "Haven't got it in you? Perhaps restart with an easier difficulty. Otherwise, I hope things come together for you in 2026!";
    activate($(".end-game > .restart"));
}

get_data("https://docs.google.com/spreadsheets/d/1cLnXZ2r3-YVcnbMKxuJyP2C69IJeeHjaGbWn8A0qabY/edit")
.then(obj => {
    const str = window.location.href.split("?=").pop();
    const row = obj.filter(el => el.key === str)[0];
    $(".card-container > h2").textContent = `Dear ${row.dear},`;
    $(".card-container > p.message").textContent = row.message;
})

if(!localStorage.getItem("is_card_read")) {
    activate($(".card.wrapper"));
    $(".go-to-game").onclick = () => {
        localStorage.setItem("is_card_read", true)
        deactivate(card_wrapper)
        menu_dialog.showModal();
        starting_menu()
        .then((res) => {game_setup(res)})
    }
} else {
    localStorage.setItem("is_card_read", false);
    deactivate(card_wrapper);
    menu_dialog.showModal();
    starting_menu()
    .then((res) => {game_setup(res)})
}

function game_setup(obj) {
    let grid_size = obj.grid_size;
    let tiles = mirrored_arr(grid_size);
    let tile_order = Array.from(tiles.keys());
    
    shuffle(tile_order);
    generate_tiles(grid_size, tiles, testing);
    display_tiles(grid_size, tile_order, obj, tiles)
    .then(() => {
        menu_dialog.close();
        activate($(".controls"));
        start_game(grid_size, obj)
        .then((res) => {
            if(!res.success) encourage();
            end_game_logic(grid_size, tiles, obj, res);
        });
    })
}

document.querySelectorAll(".restart").forEach(restart => {restart.onclick = () => window.location.reload()})

