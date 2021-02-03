require('dotenv').config();
const Pokedex = require('pokedex-promise-v2');
const fetch = require('node-fetch');
const jsdom = require('jsdom');

const api = new Pokedex();

// getting random pokemon id
const getRandomPokemonId = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// getting list of pokemon filtered by type
async function getPokemonByType(filter) {
  const response = await api.getTypeByName(filter);
  const list = [];
  const pok = response.pokemon;
  const { length } = Object.keys(pok);
  for (let i = 0; i < length; i += 1) {
    const { name } = pok[i].pokemon;
    const onlyName = name.split('-')[0];
    list.push(onlyName);
  }

  return list
    .filter((value, index, self) => self.indexOf(value) === index)
    .map((x) => `/${x}`)
    .join(', ');
}

// Generation I
// Generation II
// Generation III
// Generation IV
// Generation V
// Generation VI
// Generation VII
// Generation VIII

// getting Pokemon's info list
async function getPokemon(attr) {
  const response = await fetch(process.env.POKEMON_INF0);
  const data = await response.json();
  const matches =
    typeof attr === 'string'
      ? data.filter((p) => p.slug === attr)
      : data.filter((p) => p.id === attr);
  const { length } = matches;
  const info = matches[length - 1];

  // getting a description from webpage
  const pokeDesc = await fetch(`${process.env.POKEMON_DESC}${info.slug}`);
  const htmlDesc = await pokeDesc.text();
  const parsedDesc = new jsdom.JSDOM(htmlDesc);

  // getting a generation from webpage
  const pokeGens = await fetch(`${process.env.POKEMON_GENS}${info.slug}`);
  const htmlGens = await pokeGens.text();
  const parsedGens = new jsdom.JSDOM(htmlGens);

  return {
    name: info.name,
    id: info.id,
    type: info.type.map((x) => `/${x}`).join(', '),
    abilities: info.abilities.join(', '),
    weakness: info.weakness.join(', '),
    height: `${info.height} m`,
    weight: `${info.weight} kg`,
    image: info.ThumbnailImage,
    generation: parsedGens.window.document.querySelectorAll('.pi-smart-data-value')[0].childNodes[0]
      .textContent,
    description: parsedDesc.window.document
      .querySelector('.version-x')
      .textContent.replace(/\n/g, '')
      .trim(),
  };
}

getPokemon(55)
  .then((response) => {
    console.log(response);
  })
  .catch((error) => {
    console.log('There was an ERROR: ', error);
  });

// usage
// <function>(param)
//   .then((data) => {
//     console.log(data);
//     process.exit(0);
//   })
//   .catch(() => {
//     console.log('err');
//     process.exit(0);
//   });

module.exports = {
  getPokemon,
  getRandomPokemonId,
  getPokemonByType,
};
