require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
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

// getting random pokemon
async function randomPokemon(ctx) {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'Something went wrong.. Try again!';
  const promises = [
    pokemon.getPokemonInfo(randomId),
    pokemon.getGenerationAndDescription(randomId),
  ];
  try {
    const responses = await Promise.all(promises);
    const data = responses.reduce((acc, val) => ({ ...acc, ...val }));
    return ctx.replyWithPhoto(
      { url: data.image },
      { caption: createTemplateByPokemon(data), parse_mode: 'Markdown' }
    );
  } catch (err) {
    return ctx.replyWithMarkdown(errorMessage);
  }
}

const app = {
  started: false,
  help_mess: null,
};

bot.start(async (ctx) => {
  if (!app.started) {
    app.help_mess = `
*Short Introduction:*
That bot can send you short Pokémon's info

*Сommands:*
To get a Pokémon, send its _name_ or _index_
To get list of Pokémons by type, send / + _type_
To get random one, go with /random or use built-in keyboard`;
    const keyboard = Keyboard.make([Key.callback('Get Random Pokemon', '/random')]);
    ctx.replyWithMarkdown(app.help_mess, keyboard.reply());
    app.started = true;
  } else {
    ctx.reply('Bot has already been started');
  }
});

// sends short into
bot.help((ctx) => {
  if (app.help_mess !== null) {
    ctx.replyWithMarkdown(app.help_mess);
    return;
  }
  ctx.replyWithMarkdown('Bot must be started first!');
});

// sends random pokemon
bot.command('random', async (ctx) => {
  await randomPokemon(ctx);
});

// sends random pokemon
bot.hears('Get Random Pokemon', async (ctx) => {
  await randomPokemon(ctx);
});

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  const command = message.startsWith('/');
  const filter = message.replace('/', '').trim().toLowerCase();

  // проверка является ли сообщение покемоном
  return pokemon
    .isPokemon(filter)
    .then(async (res) => {
      const isPokemon = res;
      const number = Number(filter);
      // если покемон: name, /name, number, /number
      if (isPokemon || number) {
        const type = number ? 'number' : 'string';
        const attr = type === 'string' ? filter : number;
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

bot.telegram.setMyCommands([
  { command: 'help', description: 'What can this bot do?' },
  { command: 'random', description: 'Get Random Pokemon' },
]);

bot.launch();
