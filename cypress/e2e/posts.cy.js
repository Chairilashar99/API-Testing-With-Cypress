describe("Post module", () => {
	const dataCount = 15;
	const randomId = Cypress._.random(16, 50);
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

	describe("Get all posts", () => {
		/**
		 * 1. return unauthorized
		 * 2. return correct count and data
		 */

		it("should return unauthorized", () => {
			cy.checkUnauthorized("GET", "/posts");
		});

		it("should return correct count and data", () => {
			cy.fixture("posts").then((postData) => {
				cy.createPosts(postData);

				// get all posts
				cy.request({
					method: "GET",
					url: "/posts",
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
				}).then((response) => {
					expect(response.status).to.eq(200);
					expect(response.body.success).to.be.true;
					expect(response.body.data.length).to.eq(postData.length);

					postData.forEach((_post, index) => {
						expect(response.body.data[index].id).to.eq(index + 1);
						expect(response.body.data[index].title).to.eq(_post.title);
						expect(response.body.data[index].content).to.eq(_post.content);
					});
				});
			});
		});
	});

	describe("Get by ID", () => {
		/**
		 * 1. return unauthorized
		 * 2. return correct data
		 * 3. return not found
		 */

		it("should return unauthorized", () => {
			cy.checkUnauthorized("GET", "/posts/999");
		});

		it("should return correct data", () => {
			cy.fixture("posts").then((postsData) => {
				postsData.forEach((_post, index) => {
					cy.request({
						method: "GET",
						url: `/posts/${index + 1}`,
						headers: {
							authorization: `Bearer ${Cypress.env("token")}`,
						},
					}).then((response) => {
						const { title, content } = response.body.data;
						expect(response.status).to.be.ok;
						expect(title).to.eq(_post.title);
						expect(content).to.eq(_post.content);
					});
				});
			});
		});

		it("should return not found", () => {
			cy.request({
				method: "GET",
				url: `/posts/${randomId}`,
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
				failOnStatusCode: false,
			}).then((response) => {
				expect(response.status).to.eq(404);
				expect(response.body.success).to.be.false;
				expect(response.body.data).to.be.null;
			});
		});
	});

	describe("Update post", () => {
		/**
		 * 1. return unauthorized
		 * 2. return not found
		 * 3. return error validation messages
		 * 4. return correct updated post
		 */

		it("should return unauthorized", () => {
			cy.checkUnauthorized("PATCH", "/posts/999");
		});

		it("should return not found", () => {
			cy.request({
				method: "PATCH",
				url: `/posts/${randomId}`,
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
				failOnStatusCode: false,
			}).then((response) => {
				expect(response.status).to.eq(404);
				expect(response.body.success).to.be.false;
				expect(response.body.data).to.be.null;
			});
		});

		it("should return error validation message", () => {
			cy.request({
				method: "PATCH",
				url: `/posts/1`,
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
				failOnStatusCode: false,
				body: {
					title: 123,
					content: randomId,
				},
			}).then((response) => {
				cy.badRequest(response, [
					"title must be a string",
					"content must be a string",
				]);
			});
		});

		it("should return correct updated post", () => {
			const newPost = {
				title: "updated title",
				content: "updated content",
			};

			cy.request({
				method: "PATCH",
				url: "/posts/1",
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
				body: newPost,
			}).then((response) => {
				const {
					success,
					data: { title, content },
				} = response.body;
				expect(response.status).to.eq(200);
				expect(success).to.be.true;
				expect(title).to.eq(newPost.title);
				expect(content).to.eq(newPost.content);
			});

			// check get by id
			cy.request({
				method: "GET",
				url: "/posts/1",
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
			}).then((response) => {
				const { title, content } = response.body.data;
				expect(title).to.eq(newPost.title);
				expect(content).to.eq(newPost.content);
			});

			// check get all posts
			cy.request({
				method: "GET",
				url: "/posts",
				headers: {
					authorization: `Bearer ${Cypress.env("token")}`,
				},
			}).then((response) => {
				const post = response.body.data.find((_post) => _post.id === 1);

				expect(post.title).to.eq(newPost.title);
				expect(post.content).to.eq(newPost.content);
			});
		});

		describe("Delete post", () => {
			/**
			 * 1. return unauthorized
			 * 2. return not found
			 * 3. successfully remove the post
			 * 4. not be found the deleted post
			 */

			it("should return unauthorized", () => {
				cy.checkUnauthorized("DELETE", "/posts/1");
			});

			it("should return not found", () => {
				cy.request({
					method: "DELETE",
					url: `/posts/${randomId}`,
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
					failOnStatusCode: false,
				}).then((response) => {
					const { success, data } = response.body;
					expect(response.status).to.eq(404);
					expect(success).to.be.false;
					expect(data).to.be.null;
				});
			});

			it("should successfully remove the post", () => {
				cy.request({
					method: "DELETE",
					url: "/posts/1",
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
				}).then((response) => {
					const { success, message } = response.body;
					expect(response.status).to.be.ok;
					expect(success).to.be.ok;
					expect(message).to.eq("Post deleted successfully");
				});
			});

			it("should not be found the deleted post", () => {
				cy.request({
					method: "GET",
					url: "/posts/1",
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
					failOnStatusCode: false,
				}).then((response) => {
					expect(response.status).to.eq(404);
				});

				cy.request({
					method: "GET",
					url: "/posts",
					headers: {
						authorization: `Bearer ${Cypress.env("token")}`,
					},
				}).then((response) => {
					const post = response.body.data.find((_post) => _post.id === 1);

					expect(post).to.be.undefined;
				});
			});
		});
	});
});
