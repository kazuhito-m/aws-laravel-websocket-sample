FROM public.ecr.aws/lambda/nodejs:18-x86_64

COPY index.js ${LAMBDA_TASK_ROOT}
  
CMD [ "index.handler" ]