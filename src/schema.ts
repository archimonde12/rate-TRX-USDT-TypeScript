const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    getTRXUSDTrate(checkTime: Int): checkResponse
    user(userAPI: String): User
    getRate(coin: String, currency: String): checkResponse
  }

  type checkResponse {
    success: Boolean!
    message: String
    rate: Float
    update_at: String
    create_at: String
  }

  type User {
    count: Int
    status: String
  }
`;

export default typeDefs;
