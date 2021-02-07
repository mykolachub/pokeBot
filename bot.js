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

const app = {
  started: false,
};

bot.start((ctx) => {
  if (!app.started) {
    const messId = ctx.message.message_id;
    const chatId = ctx.chat.id;
    ctx.replyWithMarkdown(
      `
*Short Introduction:*
That bot can send you short Pokémon's info

*Сommands:*
To get a Pokémon, send its _name_ or _index_
To get list of Pokémons by type, send / + _type_
To get random one, use built-in keyboard`,
      {
        ...Markup.keyboard(['Get Random Pokemon']).resize(),
      }
    );
    ctx.telegram.pinChatMessage(chatId, messId + 1);
    app.started = true;
  } else {
    ctx.reply('Bot has already been started');
  }
});

bot.hears('Get Random Pokemon', async (ctx) => {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'Something went wrong.. Try again!';
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
    ctx.replyWithMarkdown(errorMessage);
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
        const errorMessage = 'There is no such _Pokémon_.. Try again!';
        const promises = [pokemon.getPokemonInfo(attr), pokemon.getGenerationAndDescription(attr)];
        try {
          const responses = await Promise.all(promises);
          const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
          ctx.replyWithPhoto(
            { url: data.image },
            { caption: createTemplateByPokemon(data), parse_mode: 'Markdown' }
          );
        } catch (err) {
          ctx.replyWithMarkdown(errorMessage);
        }
      } else if (command && filter !== 'start' && !isPokemon) {
        // если не покемон а тип: /type
        const errorMessage = 'There is no such Pokémon _type_.. Try again!';
        try {
          const data = await pokemon.getPokemonByType(filter);
          const template = createTemplateByType(filter, data);
          ctx.replyWithMarkdown(template);
        } catch (error) {
          ctx.replyWithMarkdown(errorMessage);
        }
      } else {
        ctx.replyWithMarkdown('I do not know what that is.. Try again!');
      }
    })
    .catch(() => {
      ctx.replyWithMarkdown('I do not know what that is.. Try again!');
    });
});

bot.launch();
