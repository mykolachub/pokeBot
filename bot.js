require('dotenv').config();
const { Telegraf, Markup } = require('telegraf');
const pokemon = require('./modules/pokemons');

const bot = new Telegraf(process.env.BOT_TOKEN);

// creates template from Pokemon's Info
function createTemplate(response) {
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

// getting Pokemon Info
function getPokemom(ctx, attr, mess) {
  return pokemon
    .getPokemon(attr)
    .then((response) => {
      ctx.replyWithPhoto(
        { url: response.image },
        { caption: createTemplate(response), parse_mode: 'Markdown' }
      );
    })
    .catch(() => {
      ctx.reply(mess);
    });
}

bot.start((ctx) => {
  ctx.reply('Welcome');
  ctx.reply('Send me name of Pokémon', {
    parse_mode: 'Markdown',
    ...Markup.keyboard(['Get Random Pokemon']).resize(),
  });
});

bot.hears('Get Random Pokemon', (ctx) => {
  const randomId = pokemon.getRandomPokemonId(1, 898);
  const errorMessage = 'Something went wrong.. Try again!';
  getPokemom(ctx, randomId, errorMessage).catch(() => ctx.reply('error'));
});

bot.on('text', async (ctx) => {
  const message = ctx.message.text;
  const command = message.startsWith('/');
  const filter = message.replace('/', '');

  // проверка является ли сообщение покемоном
  await pokemon
    .isPokemon(filter)
    .then((res) => {
      const isPokemon = res;
      const number = Number(filter);

      // если покемон
      if (isPokemon || number) {
        const type = number ? 'number' : 'string';
        const attr = type === 'string' ? filter.trim().toLowerCase() : number;
        const errorMessage = 'Something went wrong or there is no such POKEMON.. Try again!';
        pokemon
          .getPokemon(attr)
          .then((response) => {
            ctx.replyWithPhoto(
              { url: response.image },
              { caption: createTemplate(response), parse_mode: 'Markdown' }
            );
          })
          .catch(() => {
            ctx.reply(errorMessage);
          });

        // если не покемон а тип
      } else if (command && filter !== 'start') {
        pokemon
          .getPokemonByType(filter)
          .then((data) => {
            const template = `
              Here is list of *${filter}* pokemons: ${data.length} ones
      
${data.list}`.trim();
            ctx.replyWithMarkdown(template);
          })
          .catch((e) => {
            ctx.reply('Something went wrong or there is no such pokemon TYPE.. Try again!');
            console.log(e);
          });
      }
    })
    .catch((err) => {
      ctx.reply('There is no such pokemon.. Try again!');
      console.log(err);
    });
});

// bot.help((ctx) => ctx.reply('Send me a sticker'));
// bot.hears('hi', (ctx) => ctx.reply('Hey there'));

bot.launch();
