require('dotenv').config();
const { Telegraf } = require('telegraf');
const { Keyboard, Key } = require('telegram-keyboard');
const mongoose = require('mongoose');
const pokemon = require('./modules/pokemons');
const template = require('./modules/templates');

// connecting database
mongoose.connect(process.env.MONGO_KEY, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on('error', (e) => {
  console.log('database connection error', e);
});
db.once('open', () => {
  console.log('connected to database');
});

const userSchema = new mongoose.Schema({
  userId: Number,
  name: String,
  pokemons: Array,
  dailyPrize: Boolean,
});

// user
const User = mongoose.model('User', userSchema);
let user;

// local chat data
const localData = {
  id: null,
};

const bot = new Telegraf(process.env.BOT_TOKEN_TEST);

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
      { caption: template.getTemplateByPokemon(data), parse_mode: 'Markdown' }
    );
  } catch (err) {
    return ctx.replyWithMarkdown(errorMessage);
  }
}

function startDailyPrize(ctx) {
  const keyboard = Keyboard.make([Key.callback('Get Random', 'random')]);
  return ctx.reply('You can catch a random Pokemon', keyboard.inline());
}

bot.start(async (ctx) => {
  try {
    const { length } = await User.find({ userId: ctx.message.chat.id });
    // проверка есть ли юзер в базе
    if (length === 0) {
      // создает нового юзера
      user = new User({
        name: ctx.message.chat.first_name,
        userId: ctx.message.chat.id,
        pokemons: [],
        dailyPrize: false,
      });

      // setting id localy
      localData.id = ctx.message.chat.id;

      // сохраняю в базу
      user.save((e) => {
        if (e) console.log(e);
        console.log(`${ctx.message.chat.first_name} successfuly registered`);
      });

      // добавляю клавиатуру для навигации
      const keyboard = Keyboard.make(['/help', '/collection']);
      ctx.replyWithMarkdown(template.getStart(), keyboard.reply());
      startDailyPrize(ctx);
      return;
    }
    // в случае если бот уже был запущен и пользователь есть в базе
    ctx.reply('Bot has already been started');
  } catch (e) {
    console.log(e);
  }
});

// sends help into
bot.command('help', (ctx) => ctx.replyWithMarkdown(template.getHelp()));

// get and send user collection
bot.command('collection', async (ctx) => {
  try {
    const { pokemons } = await User.findOne({ userId: localData.id });
    ctx.replyWithMarkdown(template.createCollectionTemplate(pokemons));
  } catch (error) {
    console.log(error);
  }
});

// sends random pokemon
bot.action('random', async (ctx) => {
  await randomPokemon(ctx);
});

// sends random pokemon
// bot.hears('Get Random Pokemon', async (ctx) => {
//   await randomPokemon(ctx);
// });

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
            { caption: template.getTemplateByPokemon(data), parse_mode: 'Markdown' }
          );
        } catch (err) {
          ctx.replyWithMarkdown(errorMessage);
        }
      } else if (command && filter !== 'start' && !isPokemon) {
        // если не покемон а тип: /type
        const errorMessage = 'There is no such Pokémon _type_.. Try again!';
        try {
          const data = await pokemon.getPokemonByType(filter);
          ctx.replyWithMarkdown(template.getTemplateByType(filter, data));
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
  { command: 'help', description: 'What should I do?' },
  { command: 'collection', description: 'View my Pokemons' },
]);

bot.launch();
