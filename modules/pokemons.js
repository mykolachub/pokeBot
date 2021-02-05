require('dotenv').config();
const Pokedex = require('pokedex-promise-v2');
const fetch = require('node-fetch');
const jsdom = require('jsdom');

const api = new Pokedex();

// getting random pokemon id
const getRandomPokemonId = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// getting Pokemon's info list
async function getPokemon(attr) {
  // getting not full info
  async function getInfo(attr) {
    const response = await fetch(process.env.POKEMON_INF0);
    const data = await response.json();
    const matches =
      typeof attr === 'string'
        ? data.filter((p) => p.slug === attr)
        : data.filter((p) => p.id === attr);
    const { length } = matches;
    const info = matches[length - 1];

    return {
      name: info.name,
      id: info.id,
      type: info.type.map((x) => `/${x}`).join(', '),
      abilities: info.abilities.join(', '),
      weakness: info.weakness.map((x) => `/${x.toLowerCase()}`).join(', '),
      height: `${info.height} m`,
      weight: `${info.weight} kg`,
      image: info.ThumbnailImage,
    };
  }

  async function getGenAndDesc(attr) {
    const response = await api.getPokemonSpeciesByName(attr);
    const list = response.flavor_text_entries;
    const match = list.filter(
      (obj) =>
        obj.language.name === 'en' &&
        (obj.version.name === 'x' || obj.version.name === 'blue' || obj.version.name === 'sword')
    )[0];
    return {
      generation: response.generation.name,
      description: match.flavor_text.replace(/\n/g, '').trim(),
    };
  }

  const promises = [getInfo(attr), getGenAndDesc(attr)];
  return Promise.all(promises)
    .then((responsesList) => responsesList.reduce((acc, val) => ({ ...acc, ...val })))
    .catch((err) => err);
}

// getting list of pokemon filtered by type
async function getPokemonByType(filter) {
  const list = [];
  const response = await api.getTypeByName(filter);
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

// checking if pokemon
async function isPokemon(attr) {
  const response = await api.getPokemonsList();
  const data = response.results;
  const initialList = [];
  for (let i = 0; i < data.length; i += 1) {
    const { name } = data[i];
    const onlyName = name.split('-')[0];
    initialList.push(onlyName);
  }
  const list = initialList.filter((value, index, self) => self.indexOf(value) === index);
  return list.includes(attr);
}

// const start = Date.now();
// isPokemon('ditto')
//   .then((response) => {
//     const end = Date.now();
//     const time = (end - start) / 1000;
//     console.log(response, time);
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.log('There was an ERROR: ', error);
//   });

module.exports = {
  getPokemon,
  getRandomPokemonId,
  getPokemonByType,
  isPokemon,
};
