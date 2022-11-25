#version 330 core
out vec4 FragColor;

struct Material {
	sampler2D diffuse;
	sampler2D specular;
	float shininess;
};


struct DirLight {
	vec3 direction;

	vec3 ambient;
	vec3 diffuse;
	vec3 specular;
};

struct PointLight {
	vec3 position;

	vec3 ambient;
	vec3 diffuse;
	vec3 specular;

	float constant;
    float linear;
    float quadratic;
};


struct SpotLight {
	vec3 position;
	vec3 direction;
	float cutOff;
	float outerCutOff;

    vec3 ambient;
    vec3 diffuse;
    vec3 specular;
};

#define NR_POINT_LIGHTS 4

in vec2 TexCoords;
in vec3 Normal;
in vec3 VertPos;

uniform DirLight dirLight;
uniform PointLight pointLights[NR_POINT_LIGHTS];
uniform SpotLight spotLight;
uniform Material material;
uniform vec3 viewPos;

vec3 CalcDirLight(DirLight dirLight, vec3 normal, vec3 viewDir);
vec3 CalcPointLight(PointLight pointLight, vec3 vertPos, vec3 normal, vec3 viewDir);
vec3 CalcSpotLight(SpotLight spotLight, vec3 vertPos, vec3 normal, vec3 viewDir);

void main()
{
	vec3 norm = normalize(Normal);
	vec3 viewDir = normalize(viewPos - VertPos);

	vec3 result = CalcDirLight(dirLight, norm, viewDir);

	for(int i = 0; i < NR_POINT_LIGHTS; i++)
        result += CalcPointLight(pointLights[i], VertPos, norm, viewDir);

	result += CalcSpotLight(spotLight, VertPos, norm, viewDir);

	FragColor = vec4(result, 1.0);
}

vec3 CalcDirLight(DirLight dirLight, vec3 normal, vec3 viewDir)
{
	vec3 ambient = dirLight.ambient * vec3(texture(material.diffuse, TexCoords));

	vec3 lightDir = normalize(-dirLight.direction);
	float diff = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = dirLight.diffuse * diff * vec3(texture(material.diffuse, TexCoords));

	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec3 specular = dirLight.specular * (spec * vec3(texture(material.specular, TexCoords)));

	return ambient + diffuse + specular;
}

vec3 CalcPointLight(PointLight pointLight, vec3 vertPos, vec3 normal, vec3 viewDir)
{
	vec3 ambient = pointLight.ambient * vec3(texture(material.diffuse, TexCoords));

	vec3 lightDir = normalize(pointLight.position - vertPos);
	float diff = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = pointLight.diffuse * diff * vec3(texture(material.diffuse, TexCoords));

	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec3 specular = pointLight.specular * (spec * vec3(texture(material.specular, TexCoords)));

	float distance = length(pointLight.position - vertPos);
	float attenuation = 1.0 / (pointLight.constant + pointLight.linear * distance + pointLight.quadratic * (distance * distance));

	ambient  *= attenuation;
	diffuse *= attenuation;
	specular *= attenuation;

	return ambient + diffuse + specular;
}

vec3 CalcSpotLight(SpotLight spotLight, vec3 vertPos, vec3 normal, vec3 viewDir)
{
	vec3 ambient = spotLight.ambient * vec3(texture(material.diffuse, TexCoords));

	vec3 lightDir = normalize(spotLight.position - vertPos);
	float diff = max(dot(normal, lightDir), 0.0);
	vec3 diffuse = spotLight.diffuse * diff * vec3(texture(material.diffuse, TexCoords));

	vec3 reflectDir = reflect(-lightDir, normal);
	float spec = pow(max(dot(viewDir, reflectDir), 0.0), material.shininess);
	vec3 specular = spotLight.specular * (spec * vec3(texture(material.specular, TexCoords)));

	float theta = dot(normalize(-spotLight.direction), (lightDir));
	float delta = (theta - spotLight.outerCutOff) / (spotLight.cutOff - spotLight.outerCutOff);
	float intensity = clamp(delta, 0.0, 1.0);

	ambient *= intensity;
	diffuse *= intensity;
	specular *= intensity;

	return ambient + diffuse + specular;
}