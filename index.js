require('dotenv').config();
const { Bot, GrammyError, HttpError, Keyboard, InlineKeyboard } = require('grammy');
const translations = require('./translations');
const bot = new Bot(process.env.BOT_API_KEY);
const { getRandomQuestion, getCorrectAnswer } = require('./utilis');

const userLanguage = new Map();

bot.command('start', async (ctx) => {
  const langKeyboard = new Keyboard()
    .text('Русский')
    .text('Українська')
    .text('English')
    .resized();

  await ctx.reply('Выбери язык / Обери мову / Choose language', {
    reply_markup: langKeyboard,
  })
});

bot.hears(['Русский', 'Українська', 'English'], async (ctx) => {
  let langCode;

  switch (ctx.message.text) {
    case 'Русский':
      langCode = 'ru';
      break;
    case 'Українська':
      langCode = 'ua';
      break;
    case 'English':
      langCode = 'en';
      break;
  }

  userLanguage.set(ctx.from.id, langCode);

  const startKeyboard = new Keyboard()
    .text('HTML')
    .text('CSS')
    .text('JavaScript')
    .row()
    .text('React')
    .text('Typescript')
    .text(translations[langCode].randomQuestion)
    .resized();
    await ctx.reply(translations[langCode].startMessage, {
      reply_markup: startKeyboard,
    });
  
    await ctx.reply(translations[langCode].chooseTopic, {
      reply_markup: startKeyboard,
    });
});

const topics = {
  ru: ['HTML', 'CSS', 'JavaScript', 'React', 'Typescript', 'Случайный вопрос'],
  ua: ['HTML', 'CSS', 'JavaScript', 'React', 'Typescript', 'Випадкове питання'],
  en: ['HTML', 'CSS', 'JavaScript', 'React', 'Typescript', 'Random Question'],
};

bot.hears(Object.values(topics).flat(), async (ctx) => {
  const lang = userLanguage.get(ctx.from.id) || 'ru';
  let topic = ctx.message.text.toLowerCase();

  if (topic === translations[lang].randomQuestion.toLowerCase()) {
    const randomTopics = ['html', 'css', 'javascript', 'react', 'typescript'];
    const randomIndex = Math.floor(Math.random() * randomTopics.length);
    topic = randomTopics[randomIndex];
  };

  const question = getRandomQuestion(topic);
  let keyboard;

  const getOptionText = (text, lang) => {
    return typeof text === 'object' && text !== null
      ? text[lang]
      : text;
  };

  if (question.hasOptions) {
    const buttonRows = question.options.map((option) => [
      InlineKeyboard.text(
        getOptionText(option.text, lang),
        JSON.stringify({
          type: `${topic}-option`,
          isCorrect: option.isCorrect,
          questionId: question.id,
        }),
      ),
    ]);

    keyboard = InlineKeyboard.from(buttonRows);
  } else {
    keyboard = new InlineKeyboard().text(
      translations[lang].getAnswer,
      JSON.stringify({
        type: topic,
        questionId: question.id,
      }),
    );
  };

  await ctx.reply(question.text[lang], {
    reply_markup: keyboard,
  });
});

bot.on('callback_query:data', async (ctx) => {
  const callbackData = JSON.parse(ctx.callbackQuery.data);
  const lang = userLanguage.get(ctx.from.id) || 'ru';

  if (!callbackData.type.includes('option')) {
    const answer = getCorrectAnswer(callbackData.type, callbackData.questionId, lang);
    await ctx.reply(answer, {
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }
    );
    await ctx.answerCallbackQuery();
    return;
  }

  if (callbackData.isCorrect) {
    await ctx.reply(translations[lang].correct);
    await ctx.answerCallbackQuery();
    return;
  }

  const answer = getCorrectAnswer(
    callbackData.type.split('-')[0], 
    callbackData.questionId,
    lang
  );
  await ctx.reply(
    `${translations[lang].incorrect} ${answer}`,
  );
  await ctx.answerCallbackQuery();
});

bot.catch((err) => {
  const ctx = err.ctx;
  console.error(`Error while handling update ${ctx.update.update_id}:`);
  const e = err.error;
  if (e instanceof GrammyError) {
    console.error('Error in request:', e.description);
  } else if (e instanceof HttpError) {
    console.error('Could not contact Telegram:', e);
  } else {
    console.error('Unknown error:', e);
  }
});

bot.start();