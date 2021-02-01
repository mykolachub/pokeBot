require('dotenv').config();
// const Pokedex = require('pokedex-promise-v2');
const fetch = require('node-fetch');
const jsdom = require('jsdom');

// const api = new Pokedex();

// getting random pokemon id
const getRandomPokemonId = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

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
  const html = await pokeDesc.text();
  const parsedDoc = new jsdom.JSDOM(html);

  return {
    name: info.name,
    id: info.id,
    type: info.type.join(', '),
    abilities: info.abilities.join(', '),
    weakness: info.weakness.join(', '),
    height: `${info.height} m`,
    weight: `${info.weight} kg`,
    image: info.ThumbnailImage,
    description: parsedDoc.window.document
      .querySelector('.version-x')
      .textContent.replace(/\n/g, '')
      .trim(),
  };
}

// usage
// const randomId = getRandomPokemonId(1, 898);
// getPokemon(randomId)
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
};
