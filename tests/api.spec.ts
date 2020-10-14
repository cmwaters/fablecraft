import { app } from "../index";
import chai from "chai"
import chaiHttp from "chai-http";

let { expect } = chai

chai.use(chaiHttp);
describe("Server!", () => {
  it("welcomes user to the api", done => {
    chai
      .request(app)
      .get("/test")
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.message).to.equals("test successful");
        done();
      });
  });
});