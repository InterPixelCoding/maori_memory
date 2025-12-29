const tiles_container = document.querySelector(".tiles");
const testing = true;
const grid_size = tiles_container.getAttribute("data-grid-size");
const grid_gap = tiles_container.getAttribute("data-grid-gap");
let difficulty = {
    is_colours: 1, // 0 = False, 1 = True
    is_rotation: 0, // 0 = False, 1 = True
}
let tiles = mirrored_arr();
let tile_order = Array.from(tiles.keys());

console.log(tile_order);

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

function el(str) {
    const split_str = str.split(".");
    const class_names = split_str[1].split(",");
    const dom_el = document.createElement(split_str[0]);
    for(let i = 0; i<class_names.length; i++) dom_el.classList.add(class_names[i]);
    return dom_el;
}

function generate_tiles(testing) {
    tiles.forEach(function(val, index) {
        const tile = el("div.tile");
        if(testing) {
            let str = val;
            if(index % grid_size >= grid_size / 2) tile.classList.add("reversed")
            tile.textContent = str;
        } else {
            // ! Image Logic
        }
        tiles_container.appendChild(tile);
    })
}

function mirrored_arr() {
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

function reveal_tiles() {
    tile_order = Array.from(tiles.keys());
    display_tiles(tile_order, reveal = true);
}

function display_tiles(tile_order, reveal=false) {
    const tiles = document.querySelectorAll(".tiles > .tile");
    let parsed_gap = parseInt(grid_gap);
    if(reveal) parsed_gap = 0

    const container_width = tiles_container.offsetWidth;
    const total_gap_width = parsed_gap * (grid_size - 1);
    const tile_size = (container_width - total_gap_width) / grid_size;

    tiles.forEach(function(tile, index) {
        const row = Math.floor(tile_order[index] / grid_size);
        const col = tile_order[index] % grid_size;

        const left = (col * tile_size) + (col * parsed_gap);
        const top = (row * tile_size) + (row * parsed_gap);

        tile.style.left = `${left}px`;
        tile.style.top = `${top}px`;
        tile.style.width = `${tile_size}px`;
        tile.style.height = `${tile_size}px`;
        if(!reveal) {
            tile.style.setProperty("--rotation", Math.floor(Math.random() * 4) * 90 * difficulty.is_rotation + "deg"); // random rotation, chooses between 0, 90, 180, 270
        } else {
            tile.style.setProperty("--rotation", "0deg");
            tile.classList.add("reveal")
        }
    });
}

generate_tiles(testing);
shuffle(tile_order);
display_tiles(tile_order);