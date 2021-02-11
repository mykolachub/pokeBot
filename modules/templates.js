// START TEMPLATE
const getStart = () => `
*Short Introduction:*
Welcome to the Pokédex. Here you can search for almost all pokemons from 8 generations and get short info about them.

*Gotta Catch 'Em All!*
Every day you will be about to /catch random pokemon right to your /collection

*What else to Do?*
To get a Pokémon's info, send its _name_ or _index_
To get a list of Pokémons by type, send /types
To get random one, go with /random`;

// created help info
const getHelp = () => `
*Help*

Every day you will be about to /catch random pokemon right to your /collection
To get a Pokémon's info, send its _name_ or _index_
To get a list of Pokémons by type, send /types
To get random one, go with /random`;

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
