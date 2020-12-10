const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    getTRXUSDTrate(checkTime: Int): checkResponse
    user(userAPI: String): User
  }

  type checkResponse {
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
`;

export default typeDefs;
