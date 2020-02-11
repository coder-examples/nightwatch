import { UserService } from '../../services'
import { Command } from '../../base'
import { Client, Message } from 'bot-ts'

export default class TransferCommand extends Command {
  constructor(client: Client) {
    super(client, {
      name: 'transfer',
      group: 'economy',
      description: 'Transfer some of your credits to someone else.',
      guildOnly: true,
      args: [
        {
          key: 'user',
          phrase: 'Who would you like to transfer credits to?\n',
          type: 'user'
        },
        {
          key: 'amount',
          phrase: 'How many credits would you like to trasfer?\n',
          type: 'number'
        }
      ]
    })
  }

  public async run(msg: Message, args: any) {
    const userService = new UserService()
    const donor = await userService
      .find(msg.author.id)
      .catch(_ => userService.create(msg.author))
      .catch(() => {
        // swallow
      })
    const receiver = await userService
      .find(args.user.id)
      .catch(_ => userService.create(args.user))
      .catch(() => {
        // swallow
      })

    if (!donor || !receiver) {
      return msg.reply(
        'Command failed. Either you or the receiver does not exist in my database.'
      )
    }

    if (args.user.id === msg.author.id) {
      return msg.reply("You can't transfer credits to yourself ;)")
    }

    if (args.amount <= 0) {
      return msg.reply('Transfers must be larger than zero.')
    }

    if (donor.balance.balance < args.amount) {
      return msg.reply(
        `Insufficient funds. You only have ${donor.balance.balance} credits.`
      )
    }

    donor.balance.balance -= args.amount
    donor.balance.netWorth -= args.amount

    receiver.balance.balance += args.amount
    receiver.balance.netWorth += args.amount

    await userService.updateBalance(donor.id, donor.balance)
    await userService.updateBalance(receiver.id, receiver.balance)

    return msg.reply(
      `You transferred ${args.amount} credit${
        args.amount === 1 ? '' : 's'
      } to ${args.user}!`
    )
  }
}
