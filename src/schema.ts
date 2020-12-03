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
  }

  type User {
    count: Int
    status: String
  }
`;

export default typeDefs;
