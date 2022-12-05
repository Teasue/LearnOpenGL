#pragma once
#include "mesh.h"
#include "stb_image.h"
#include <assimp/Importer.hpp>
#include <assimp/scene.h>
#include <assimp/postprocess.h>


class Model 
{
public:
	Model(string path)
	{
		loadModel(path);
	};

	void Draw(Shader shader)
	{
		for (unsigned int i = 0; i < meshes.size(); i++)
		{
			meshes[i].Draw(shader);
		}
	};

private:
	vector<Mesh> meshes;
	string directory;
	vector<Texture> loadedTexture;

	void loadModel(string path)
	{
		Assimp::Importer importer;
		const aiScene* scene = importer.ReadFile(path, aiProcess_Triangulate );
		//const aiScene* scene = importer.ReadFile(path, aiProcess_Triangulate | aiProcess_FlipUVs);
		if (!scene || scene->mFlags & AI_SCENE_FLAGS_INCOMPLETE || !scene->mRootNode)
		{
			cout << "ERROR::ASSIMP::" << importer.GetErrorString() << endl;
			return;
		}

		directory = path.substr(0, path.find_last_of('/'));
		processNode(scene->mRootNode, scene);
	};

	void processNode(aiNode* rootnode, const aiScene* scene)
	{
		for (unsigned int i = 0; i < rootnode->mNumMeshes; i++)
		{
			aiMesh* mesh = scene->mMeshes[rootnode->mMeshes[i]];
			meshes.push_back(processMesh(mesh, scene));
		}

		for (unsigned int i = 0; i < rootnode->mNumChildren; i++)
		{
			processNode(rootnode->mChildren[i], scene);
		}
	};

	Mesh processMesh(aiMesh* mesh, const aiScene* scene)
	{
		vector<Vertex> vertices;
		vector<unsigned int> indices;
		vector<Texture> textures;

		for (unsigned int i = 0; i < mesh->mNumVertices; i++)
		{
			Vertex vertex;
			glm::vec3 vector;
			vector.x = mesh->mVertices[i].x;
			vector.y = mesh->mVertices[i].y;
			vector.z = mesh->mVertices[i].z;
			vertex.Position = vector;

			vector.x = mesh->mNormals[i].x;
			vector.y = mesh->mNormals[i].y;
			vector.z = mesh->mNormals[i].z;
			vertex.Normal = vector;

			if (mesh->mTextureCoords[0])
			{
				glm::vec2 vector;
				vector.x = mesh->mTextureCoords[0][i].x;
				vector.y = mesh->mTextureCoords[0][i].y;
				vertex.TexCoords = vector;
			}
			else
			{
				vertex.TexCoords = glm::vec2(0.0f, 0.0f);
			}

			vertices.push_back(vertex);
		}

		for (unsigned int i = 0; i < mesh->mNumFaces; i++)
		{
			for (unsigned int j = 0; j < mesh->mFaces[i].mNumIndices; j++)
			{
				indices.push_back(mesh->mFaces[i].mIndices[j]);
			}
		}

		if (mesh->mMaterialIndex >= 0)
		{
			aiMaterial* material = scene->mMaterials[mesh->mMaterialIndex];
			vector<Texture> diffuseMaps = loadMaterialTextures(material, aiTextureType_DIFFUSE, "texture_diffuse");
			vector<Texture> specularMaps = loadMaterialTextures(material, aiTextureType_SPECULAR, "texture_sepcular");
			
			textures.insert(textures.end(), diffuseMaps.begin(), diffuseMaps.end());
			textures.insert(textures.end(), specularMaps.begin(), specularMaps.end());
		}

		return Mesh(vertices, indices, textures);
	};

	vector<Texture> loadMaterialTextures(aiMaterial* material, aiTextureType type, string name)
	{
		vector<Texture> textures;
		for (unsigned int i = 0; i < material->GetTextureCount(type); i++)
		{
			aiString path;
			material->GetTexture(type, i, &path);
			bool skip = false;
			for (unsigned int j = 0; j < loadedTexture.size(); j++)
			{
				if (std::strcmp(loadedTexture[j].path.data(), path.C_Str()) == 0)
				{
					textures.push_back(loadedTexture[j]);
					skip = true;
				}
			}

			if (!skip)
			{
				Texture texture;
				texture.id = textureFromFile(path.C_Str(), directory);
				texture.type = name;
				texture.path = path.C_Str();
				textures.push_back(texture);
				loadedTexture.push_back(texture);
			}
		}

		return textures;
	};

	unsigned int textureFromFile(string path, string directory) 
	{
		string filename = string(path);
		filename = directory + '/' + filename;

		unsigned int textureID;
		glGenTextures(1, &textureID);

		int width, height, nrComponents;
		unsigned char* data = stbi_load(filename.c_str(), &width, &height, &nrComponents, 0);
		if (data)
		{
			GLenum format = GL_RGBA;
			if (nrComponents == 1)
				format = GL_RED;
			else if (nrComponents == 3)
				format = GL_RGB;
			else if (nrComponents == 4)
				format = GL_RGBA;

			glBindTexture(GL_TEXTURE_2D, textureID);
			glTexImage2D(GL_TEXTURE_2D, 0, format, width, height, 0, format, GL_UNSIGNED_BYTE, data);
			glGenerateMipmap(GL_TEXTURE_2D);

			glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, GL_REPEAT);
			glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, GL_REPEAT);
			glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, GL_LINEAR_MIPMAP_LINEAR);
			glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, GL_LINEAR);

			stbi_image_free(data);
		}
		else
		{
			std::cout << "Texture failed to load at path: " << path << std::endl;
			stbi_image_free(data);
		}

		return textureID;
	};
};