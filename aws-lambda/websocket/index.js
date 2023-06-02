exports.handler = async (event, context) => {
  console.log('これ、もしかして正しく出ている？');
  console.log(event);
  console.log(context);

  return { statusCode: 200, body: '途中で終わった系の関数。' };
};
