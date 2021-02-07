require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const pokemon = require('./modules/pokemons');

const bot = new Telegraf(process.env.BOT_TOKEN);

// creates template from Pokemon's Info
function createTemplateByPokemon(response) {
  return `
*${response.name}* #${response.id}
Type: ${response.type}

${response.description}

${response.generation}
Abilities: ${response.abilities}
Weakness: ${response.weakness}
Height: ${response.height}
Weight: ${response.weight}`;
}

function createTemplateByType(filter, data) {
  return `
Here is list of *${filter}* pokemons: ${data.length} ones

${data.list}
  `;
}

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply('Send me name of Pokémon', {
    parse_mode: 'Markdown',
    ...Markup.keyboard(['Get Random Pokemon']).resize(),
  });
});

bot.hears('Get Random Pokemon', async (ctx) => {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'There is no such POKEMON.. Try again!';
  const promises = [
    pokemon.getPokemonInfo(randomId),
    pokemon.getGenerationAndDescription(randomId),
  ];
  try {
    const responses = await Promise.all(promises);
    const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
    ctx.replyWithPhoto(
      { url: data.image },
      { caption: createTemplateByPokemon(data), parse_mode: 'Markdown' }
    );
  } catch (err) {
    ctx.reply(errorMessage);
  }
});

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  const command = message.startsWith('/');
  const filter = message.replace('/', '');

  // проверка является ли сообщение покемоном
  return pokemon
    .isPokemon(filter)
    .then(async (res) => {
      const isPokemon = res;
      const number = Number(filter);

      // если покемон: name, /name, number, /number
      if (isPokemon || number) {
        const type = number ? 'number' : 'string';
        const attr = type === 'string' ? filter.trim().toLowerCase() : number;
        const errorMessage = 'There is no such POKEMON.. Try again!';
        const promises = [pokemon.getPokemonInfo(attr), pokemon.getGenerationAndDescription(attr)];
        try {
          const responses = await Promise.all(promises);
          const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
          ctx.replyWithPhoto(
            { url: data.image },
            { caption: createTemplateByPokemon(data), parse_mode: 'Markdown' }
          );
        } catch (err) {
          ctx.reply(errorMessage);
        }
      } else if (command && filter !== 'start' && !isPokemon) {
        // если не покемон а тип: /type
        const errorMessage = 'There is no such pokemon TYPE.. Try again!';
        try {
          const data = await pokemon.getPokemonByType(filter);
          const template = createTemplateByType(filter, data);
          ctx.replyWithMarkdown(template);
        } catch (error) {
          ctx.reply(errorMessage);
        }
      } else {
        ctx.reply('I do not know what that is.. Try again!');
      }
    })
    .catch(() => {
      ctx.reply('I do not know what that is.. Try again!');
    });
});

bot.launch();
