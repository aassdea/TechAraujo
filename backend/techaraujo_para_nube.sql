SET FOREIGN_KEY_CHECKS=0;
DROP TABLE IF EXISTS `mensaje`,`chat`,`componente`,`servicio`,`trabajo`,`equipo`,`ticket`,`usuario`;
SET FOREIGN_KEY_CHECKS=1;

CREATE TABLE `usuario` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(20) DEFAULT NULL,
  `apellido` varchar(30) DEFAULT NULL,
  `rol` tinyint(1) DEFAULT 0,
  `email` varchar(255) DEFAULT NULL,
  `google_sub` varchar(255) DEFAULT NULL,
  `password_hash` char(32) DEFAULT NULL,
  `direccion` varchar(200) DEFAULT NULL,
  `fecha` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_usuario_google_sub` (`google_sub`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `ticket` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tipo` tinyint(1) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 0,
  `fecha_emi` date DEFAULT NULL,
  `cliente_id` int(11) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `tecnico_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `cliente_id` (`cliente_id`), KEY `tecnico_id` (`tecnico_id`),
  CONSTRAINT `ticket_ibfk_1` FOREIGN KEY (`cliente_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `ticket_ibfk_2` FOREIGN KEY (`tecnico_id`) REFERENCES `usuario` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `equipo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ticket_id` int(11) DEFAULT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `ticket_id` (`ticket_id`),
  CONSTRAINT `equipo_ibfk_1` FOREIGN KEY (`ticket_id`) REFERENCES `ticket` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `trabajo` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `diagnostico` text DEFAULT NULL,
  `notas` text DEFAULT NULL,
  `presupuesto` decimal(10,2) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 0,
  `fecha_ing` date DEFAULT NULL,
  `fecha_sal` date DEFAULT NULL,
  `equipo_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `equipo_id` (`equipo_id`),
  CONSTRAINT `trabajo_ibfk_1` FOREIGN KEY (`equipo_id`) REFERENCES `equipo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `componente` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `precio` decimal(10,2) DEFAULT NULL,
  `unidad` tinyint(1) DEFAULT 1,
  `instalado` tinyint(1) DEFAULT 0,
  `trabajo_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `trabajo_id` (`trabajo_id`),
  CONSTRAINT `componente_ibfk_1` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `servicio` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  `estado` tinyint(1) DEFAULT 0,
  `precio` decimal(10,2) DEFAULT NULL,
  `trabajo_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `trabajo_id` (`trabajo_id`),
  CONSTRAINT `servicio_ibfk_1` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `chat` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `trabajo_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `trabajo_id` (`trabajo_id`),
  CONSTRAINT `chat_ibfk_1` FOREIGN KEY (`trabajo_id`) REFERENCES `trabajo` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE `mensaje` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `mensaje` text DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  `usuario_id` int(11) DEFAULT NULL,
  `chat_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`), KEY `usuario_id` (`usuario_id`), KEY `chat_id` (`chat_id`),
  CONSTRAINT `mensaje_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `usuario` (`id`),
  CONSTRAINT `mensaje_ibfk_2` FOREIGN KEY (`chat_id`) REFERENCES `chat` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `usuario` (`nombre`,`apellido`,`rol`,`email`,`password_hash`,`direccion`,`fecha`) VALUES
('Administrador','',2,'admin@techrepair.com',MD5('admin123'),'','2026-08-12'),
('Tecnico','Principal',1,'tecnico@techrepair.com',MD5('tecnico123'),'','2026-08-12');
