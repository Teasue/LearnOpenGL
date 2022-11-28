#pragma once
#include "shader.h"
#include <vector>

using namespace std;

const string DIFFUSE_TYPE = "texture_diffuse";
const string SPECULAR_TYPE = "texture_specular";
const string MATERIAL = "material";

struct Vertex {
	glm::vec3 Position;
	glm::vec3 Normal;
	glm::vec2 TexCoords;
};

struct Texture {
	unsigned int id;
	string type;
};

class Mesh {
public:
	vector<Vertex> vertices;
	vector<unsigned int> indices;
	vector<Texture> textures;

	Mesh(vector<Vertex> vertices, vector<unsigned int> indices, vector<Texture> textures)
	{
		this->vertices = vertices;
		this->indices = indices;
		this->textures = textures;

		Init();
	};

	void Draw(Shader shader) 
	{
		unsigned int diffuseIndex = 1;
		unsigned int specularIndex = 1;
		
		for (unsigned int i = 0; i < textures.size(); i++)
		{
			glActiveTexture(GL_TEXTURE0 + i);
			string index;
			string type = textures[i].type;
			if (type == DIFFUSE_TYPE)
				index = to_string(diffuseIndex++);
			else if (type == SPECULAR_TYPE)
				index = to_string(specularIndex++);

			shader.setInt(MATERIAL + type, i);
			glBindTexture(GL_TEXTURE_2D, textures[i].id);
		}

		glActiveTexture(GL_TEXTURE0);

		glBindVertexArray(VAO);
		glDrawElements(GL_TRIANGLES, indices.size(), GL_UNSIGNED_INT, 0);
		glBindVertexArray(0);
	};
private:
	unsigned int VAO, VBO, EBO;

	void Init()
	{
		glGenVertexArrays(1, &VAO);
		glGenBuffers(1, &VBO);
		glGenBuffers(1, &EBO);

		glBindVertexArray(VAO);

		glBindBuffer(GL_ARRAY_BUFFER, VBO);
		glBufferData(GL_ARRAY_BUFFER, vertices.size() * sizeof(Vertex), &vertices[0], GL_STATIC_DRAW);

		glBindBuffer(GL_ELEMENT_ARRAY_BUFFER, EBO);
		glBufferData(GL_ELEMENT_ARRAY_BUFFER, indices.size() * sizeof(unsigned int), &indices[0], GL_STATIC_DRAW);

		glVertexAttribPointer(0, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)0);
		glEnableVertexAttribArray(0);
		glVertexAttribPointer(1, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, Normal));
		glEnableVertexAttribArray(1);
		glVertexAttribPointer(2, 3, GL_FLOAT, GL_FALSE, sizeof(Vertex), (void*)offsetof(Vertex, TexCoords));
		glEnableVertexAttribArray(2);

		glBindVertexArray(0);
	};
};