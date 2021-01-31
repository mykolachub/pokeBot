const Pokedex = require('pokedex-promise-v2');

const api = new Pokedex();

// getting random pokemon id
const getRandomPokemonId = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

// getting a Pokemon by name
async function getPokemon(pokemonName) {
  const response =
    typeof pokemonName === 'string'
      ? await api.getPokemonByName(pokemonName)
      : await api.resource(`api/v2/pokemon/${pokemonName}`);

  const pokemon = {
    name: response.name,
    id: response.id,
    image: response.sprites.front_default,
    types: response.types.map((type) => type.type.name).join(', '),
  };

  return pokemon;
}

module.exports = {
  getPokemon,
  getRandomPokemonId,
};
