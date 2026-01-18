DROP DATABASE IF EXISTS SampleQuiz_RoadSafety;

CREATE DATABASE SampleQuiz_RoadSafety;

USE SampleQuiz_RoadSafety;

CREATE TABLE Roles (
    Rolename VARCHAR(16) NOT NULL,
    RoleLevel INT NOT NULL,
    PRIMARY KEY (Rolename)
);

INSERT INTO Roles
    (Rolename, RoleLevel)
VALUES
    ("ADMIN", 99),
    ("PLAYER", 10);

CREATE TABLE User (
    ID INT NOT NULL AUTO_INCREMENT,
    UserName VARCHAR(255) NOT NULL UNIQUE,
    UserPassword VARCHAR(255) NOT NULL,
    UserEmail VARCHAR(255) DEFAULT NULL,
    UserRole VARCHAR(16) NOT NULL,
    PRIMARY KEY (ID),
    FOREIGN KEY (UserRole) REFERENCES Roles(Rolename)
);

CREATE TABLE Scores (
    ID INT NOT NULL AUTO_INCREMENT,
    UserID INT NOT NULL,
    LevelID INT NOT NULL,
    QuizMark INT NOT NULL DEFAULT 0,
    TotalQuizMark INT NOT NULL,
    StartDatetime BIGINT NOT NULL,
    CompletionDatetime BIGINT DEFAULT NULL,
    QuizInfo JSON NOT NULL,
    PRIMARY KEY (ID),
    FOREIGN KEY (UserID) REFERENCES User(ID) ON DELETE CASCADE 
);