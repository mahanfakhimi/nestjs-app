import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const CurrentUser = createParamDecorator((data: string, context: ExecutionContext) => {
  const ctx = context.switchToHttp();
  const user = ctx.getRequest().user;
  return data ? user?.[data] : user;
});
