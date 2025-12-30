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
        is_colours: 1,
        is_rotation: 0,
        avg_playtime: "1",
        hue: 95,
    },
    {
        gamemode: "Medium",
        grid_size: 4,
        is_colours: 0,
        is_rotation: 0,
        avg_playtime: "2-3",
        hue: 25,
    },
    {
        gamemode: "Hard",
        grid_size: 6,
        is_colours: 1,
        is_rotation: 0,
        avg_playtime: "4-5",
        hue: -55,
    },
    {
        gamemode: "Extra Hard",
        grid_size: 6,
        is_colours: 0,
        is_rotation: 1,
        avg_playtime: "8-10",
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
const start_game = $(".start-game")
const info_padding = 10;
const modal = $("dialog")

generate_gamemode_info();

const gamemode_spans = document.querySelectorAll(".difficulties > span");

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
    tiles.forEach(function(val, index) {
        const tile = el("div.tile");
        tile.style.backgroundImage = `url(${image_src})`;
        if(index % grid_size >= grid_size / 2) tile.classList.add("reversed");
        if(testing) {
            let str = val;
            tile.textContent = str;
        } 
        tile.style.zIndex = tiles.length - index;
        tile.style.display = "none";
        tiles_container.appendChild(tile);
    })
}

function mirrored_arr(grid_size) {
    let tiles = [];
    for (let i = 0; i < grid_size ** 2; i++) {
        let row = Math.floor(i / grid_size);
        let col = i % grid_size;
        let mirror_col = Math.min(col, grid_size - 1 - col);
        let half_width = Math.ceil(grid_size / 2);
        let val = row * half_width + mirror_col + 1;
        tiles.push(val);
    }
    return tiles;
}

function reveal_tiles(grid_size, tiles, difficulty) {
    tile_order = Array.from(tiles.keys());
    display_tiles(grid_size, tile_order, difficulty, tiles, reveal = true);
}

function tile_transforms(tile, pos, tile_size, container_width, offset_pos) {
    tile.style.left = `${pos.left}px`;
    tile.style.top = `${pos.top}px`;
    tile.style.width = `${tile_size}px`;
    tile.style.height = `${tile_size}px`;
    tile.style.setProperty("--image-size", `${container_width / 2}px ${container_width}px`); // Image width is contains left half of image
    tile.style.setProperty("--tile-offset", `${-offset_pos.left - 1}px ${-offset_pos.top - 3}px`); // 2px offset due to bottom of image repeating at top
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

function display_tiles(grid_size, tile_order, difficulty, tile_arr, reveal=false) {
    const tiles = document.querySelectorAll(".tiles > .tile");
    let parsed_gap = parseInt(grid_gap);
    if(reveal) parsed_gap = 0

    const container_width = tiles_container.offsetWidth;
    const total_gap_width = parsed_gap * (grid_size - 1);
    const tile_size = (container_width - total_gap_width) / grid_size;

    tiles.forEach(function(tile, index) {
        const pos = calculate_grid_pos(grid_size, image_based = false, index, tile_order, parsed_gap, tile_arr, tile_size);
        const offset_pos = calculate_grid_pos(grid_size, image_based = true, index, tile_order, parsed_gap, tile_arr, tile_size);
        if(!reveal) {
            tile.style.setProperty("--rotation", Math.floor(Math.random() * 4) * 90 * difficulty.is_rotation + "deg"); // random rotation, chooses between 0, 90, 180, 270;
            tile.style.setProperty("--bg-colour", `hsl(${difficulty.is_colours * (360 / (grid_size**2 / 2) * tile_arr[index])}deg ${30 * difficulty.is_colours}% 40%)`);
            tile_transforms(tile, pos, tile_size, container_width, offset_pos);
            tile.style.display = "initial";
        } else {
            setTimeout(() => {
                tile_transforms(tile, pos, tile_size, container_width, offset_pos);
                tile.style.setProperty("--rotation", "0deg");
                tile.style.setProperty("--bg-colour", "hsl(0deg 0% 0%)");
                tile.classList.add("reveal")
            }, index * 100);
        }
    });

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
        const margin = 20;
        const steps = gamemodes.length - 1;
        let previous_gamemode = gamemode_spans[0];
        let difficulty = gamemodes[0]

        function get_slider_state(client_x) {
            const left = slider.offsetLeft + margin;
            const right = slider.offsetLeft + slider.offsetWidth - margin;
            const width = right - left;

            const x = Math.min(Math.max(client_x, left), right);
            const t = (x - left) / width; // 0 → 1
            const step_index = Math.round(t * steps);

            return { x, t, step_index, width };
        }

        thumb_track.addEventListener("pointermove", (e) => {
            const { x, step_index, width } = get_slider_state(e.clientX);
            difficulty = gamemodes[step_index];

            if(gamemode_spans[step_index] !== previous_gamemode) {
                let current_gamemode = gamemode_spans[step_index];
                deactivate($(`.info > ul.${previous_gamemode.textContent.replace(" ","-").toLowerCase()}`));
                deactivate(previous_gamemode);
                activate(current_gamemode);
                activate($(`.info > ul.${current_gamemode.textContent.replace(" ","-").toLowerCase()}`));
                previous_gamemode = current_gamemode;
                thumb_track.style.filter = `hue-rotate(${difficulty.hue}deg)`;
            }
            
            thumb_track.style.left = `${x - slider.offsetLeft}px`;

        });

        thumb_track.addEventListener("pointerout", (e) => {
            const { step_index, width } = get_slider_state(e.clientX);
            difficulty = gamemodes[step_index];

            thumb_track.style.left = `${
                (step_index / steps) * width + margin
            }px`;
        });

        start_game.addEventListener("click", () => {
            resolve(difficulty);
        })
    })
}

starting_menu()
.then((res) => {game_setup(res)})

function game_setup(obj) {
    let grid_size = obj.grid_size;
    let tiles = mirrored_arr(grid_size);
    let tile_order = Array.from(tiles.keys());
    shuffle(tile_order);
    generate_tiles(grid_size, tiles, testing);
    display_tiles(grid_size, tile_order, obj, tiles);
    modal.close();
    setTimeout(() => {
        reveal_tiles(grid_size, tiles, obj);
    }, 2000);
}

