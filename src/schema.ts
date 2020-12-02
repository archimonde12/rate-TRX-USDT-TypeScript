const { gql } = require("apollo-server");

const typeDefs = gql`
  type Query {
    getTRXUSDTrate(checkTime: Int): checkResponse
  }

  type checkResponse {
    success: Boolean!
    message: String
    rate: Float
    update_at: String
    create_at: String
  }
`;

export default typeDefs;
