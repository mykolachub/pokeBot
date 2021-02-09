const { Collection } = require('mongoose');

// START TEMPLATE
const getStart = () => `
*Short Introduction:*
That bot can send you short Pokémon's info

*Сommands:*
To get a Pokémon, send its _name_ or _index_
To get list of Pokémons by type, send / + _type_
To get random one, go with /random or use built-in keyboard`;

// created help info
const getHelp = () => `
here is help list`;

// creates template from Pokemon's Info
const getTemplateByPokemon = (response) => `
*${response.name}* #${response.id}
Type: ${response.type}

${response.description}

${response.generation}
Abilities: ${response.abilities}
Weakness: ${response.weakness}
Height: ${response.height}
Weight: ${response.weight}`;

// creates template for Pokemons list by type
const getTemplateByType = (filter, data) => `
Here is list of *${filter}* pokemons: ${data.length} ones

${data.list}`;

const createCollectionTemplate = (collection) => {
  if (collection.length === 0) {
    return `
In your Collection contains *${collection.length}* pokemons. 

Wait for Daily Prize to catch one!`;
  }
  return `
In your Collection contains *${collection.length}* pokemons. 

You have already got:
${collection.map((x) => `/${x}`).join(', ')}
`;
};

module.exports = {
  getStart,
  getHelp,
  getTemplateByPokemon,
  getTemplateByType,
  createCollectionTemplate,
};
