const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    getTRXUSDTrate(checkTime: Int): getRateResponse
    user(userAPI: String): User
  }

  type getRateResponse {
    success: Boolean!
    message: String
    rate: Float
    update_at: String
    create_at: String
    count: Int
    remain: Int
    reactiveAt: Int
    code: String
  }

  type User {
    code: String
    count: Int
    status: String
    remain: Int
    reactiveAt: Int
  }

  type Subscription {
    countNotification: Message
  }

  type Message {
    text: String
    reactiveAt: Int
  }
`;

export default typeDefs;
