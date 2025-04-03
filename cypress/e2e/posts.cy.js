describe("Post module", () => {
	const dataCount = 15;
	before("login", () => {
		cy.login();
	});

	before("generate posts data", () => cy.generatePostsData(dataCount));

	describe("Create post", () => {
		/**
		 * 1. return unauthorized
		 * 2. return error validation messages
		 * 3. return correct post
		 */

		it("should return unauthorized", () => {
			cy.checkUnauthorized("POST", "/posts");
		});

		it("should return error validation messages", () => {
			cy.request({
				method: "POST",
				url: "/posts",
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
				failOnStatusCode: false,
			}).then((response) => {
				cy.badRequest(response, [
					"title must be a string",
					"content must be a string",
				]);
			});
		});

		it("should return correct post", () => {
			cy.fixture("posts").then((postData) => {
				cy.request({
					method: "POST",
					url: "/posts",
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
					body: {
						title: postData[0].title,
						content: postData[0].content,
					},
				}).then((response) => {
					const {
						success,
						data: { title, content, comments },
					} = response.body;
					expect(response.status).to.eq(201);
					expect(success).to.be.true;
					expect(title).to.eq(postData[0].title);
					expect(content).to.eq(postData[0].content);
					expect(comments.length).to.eq(0);
				});
			});
		});
	});
});
