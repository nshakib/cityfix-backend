import { NotificationType } from "../../../generated/prisma/enums";

export interface INotificationInput {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
}